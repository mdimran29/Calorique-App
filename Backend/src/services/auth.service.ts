// src/services/auth.service.ts
import axios from 'axios';
import { getFirebaseAdmin } from '../config/firebase';
import { userRepository } from '../repositories/user.repository';
import { RefreshToken } from '../models/RefreshToken.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokenUtils';
import { ApiError } from '../utils/ApiError';
import { IUser } from '../models/User.model';
import { logger } from '../utils/logger';

const FIREBASE_API_KEY = () => process.env.FIREBASE_API_KEY ?? process.env.GEMINI_API_KEY; // fallback hint
const FIREBASE_SIGNIN_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
const FIREBASE_SIGNUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp';

export interface RegisterPayload {
  // Classic email/password registration
  email?: string;
  name?: string;
  password?: string;
  // OR Firebase token (from Firebase client SDK) — covers Google Sign-In and Phone OTP
  firebaseToken?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  goal?: string;
  foodPreference?: string;
  allergies?: string[];
  displayName?: string; // alias for name
}

type DecodedFirebaseUser = {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
  picture?: string;
  firebase?: { sign_in_provider?: string };
};

function inferAuthProvider(decoded: DecodedFirebaseUser): 'google' | 'phone' | 'password' {
  const provider = decoded.firebase?.sign_in_provider ?? '';
  if (provider.includes('google')) return 'google';
  if (provider.includes('phone')) return 'phone';
  return 'password';
}

/** Phone-only Firebase accounts have no email — synthesize a stable placeholder so the
 *  required/unique `email` field on User is always satisfiable without weakening the schema. */
function placeholderEmail(uid: string): string {
  return `${uid}@phone.calorique.app`;
}

export const authService = {
  async verifyFirebaseToken(token: string) {
    try {
      const admin = getFirebaseAdmin();
      return await admin.auth().verifyIdToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid Firebase token');
    }
  },

  /**
   * Sign up via Firebase REST API (email + password), then create local user
   */
  async register(payload: RegisterPayload) {
    let decodedToken: DecodedFirebaseUser;
    let authProvider: 'password' | 'google' | 'phone' = 'password';

    if (payload.firebaseToken) {
      // Client-side Firebase SDK flow — covers Google Sign-In and Phone OTP,
      // as well as mobile email/password. Identity comes from the verified token itself.
      decodedToken = await authService.verifyFirebaseToken(payload.firebaseToken);
      authProvider = inferAuthProvider(decodedToken);
    } else if (payload.password) {
      if (!payload.email) throw ApiError.badRequest('Email is required for password registration');
      const email = payload.email.toLowerCase();
      // Web flow — create user in Firebase via REST API
      const apiKey = process.env.FIREBASE_WEB_API_KEY ?? FIREBASE_API_KEY();
      if (!apiKey) {
        throw ApiError.internal('Firebase web API key not configured');
      }
      try {
        const res = await axios.post(`${FIREBASE_SIGNUP_URL}?key=${apiKey}`, {
          email,
          password: payload.password,
          returnSecureToken: true,
        });
        const { localId } = res.data;
        // Update display name in Firebase
        try {
          const admin = getFirebaseAdmin();
          await admin.auth().updateUser(localId, { displayName: payload.name ?? payload.displayName ?? 'User' });
        } catch { /* non-critical */ }
        decodedToken = { uid: localId, email };
      } catch (err: any) {
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('Firebase signup failed, using local mock UID for development');
          decodedToken = { uid: `mock-uid-${email}`, email };
        } else {
          const msg = err?.response?.data?.error?.message ?? 'Registration failed';
          if (msg.includes('EMAIL_EXISTS')) throw ApiError.conflict('Email already registered');
          logger.error('Firebase signup error', err?.response?.data);
          throw ApiError.badRequest(msg);
        }
      }
    } else {
      throw ApiError.badRequest('Either password or firebaseToken is required');
    }

    const name = payload.name ?? payload.displayName ?? decodedToken.name
      ?? (decodedToken.email ? decodedToken.email.split('@')[0] : null)
      ?? (decodedToken.phone_number ?? 'User');
    const email = (payload.email ?? decodedToken.email ?? placeholderEmail(decodedToken.uid)).toLowerCase();

    // Check if already registered locally (by Firebase UID first — the durable identity)
    const existing = await userRepository.findByFirebaseUid(decodedToken.uid)
      ?? (decodedToken.email ? await userRepository.findByEmail(email) : null);
    if (existing) {
      // User already exists — return tokens (idempotent register)
      const tokens = await authService.generateTokenPair(existing);
      return { user: existing, ...tokens };
    }

    const user = await userRepository.create({
      firebaseUid:    decodedToken.uid,
      name,
      email,
      phoneNumber:    decodedToken.phone_number,
      authProvider,
      avatar:         decodedToken.picture,
      age:            payload.age,
      gender:         payload.gender as IUser['gender'],
      height:         payload.height,
      weight:         payload.weight,
      activityLevel:  payload.activityLevel as IUser['activityLevel'],
      goal:           payload.goal as IUser['goal'],
      foodPreference: payload.foodPreference as IUser['foodPreference'],
      allergies:      payload.allergies ?? [],
      profileComplete: !!(payload.age && payload.height && payload.weight && payload.goal),
    });

    const tokens = await authService.generateTokenPair(user);
    return { user, ...tokens };
  },

  /**
   * Login — accepts either email/password or a Firebase ID token
   * (ID tokens cover Google Sign-In, Phone OTP, and mobile email/password alike)
   */
  async login(payload: { firebaseToken?: string; email?: string; password?: string }) {
    let uid: string;
    let decoded: DecodedFirebaseUser | null = null;

    if (payload.firebaseToken) {
      decoded = await authService.verifyFirebaseToken(payload.firebaseToken);
      uid = decoded.uid;
    } else if (payload.email && payload.password) {
      const apiKey = process.env.FIREBASE_WEB_API_KEY ?? FIREBASE_API_KEY();
      if (!apiKey) throw ApiError.internal('Firebase web API key not configured');
      try {
        const res = await axios.post(`${FIREBASE_SIGNIN_URL}?key=${apiKey}`, {
          email:             payload.email,
          password:          payload.password,
          returnSecureToken: true,
        });
        uid = res.data.localId;
      } catch (err: any) {
        logger.error('Firebase signin failed details', {
          status: err?.response?.status,
          data: err?.response?.data,
          message: err?.message
        });
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('Firebase signin failed, using local mock UID for development');
          uid = `mock-uid-${payload.email?.toLowerCase()}`;
        } else {
          const msg = err?.response?.data?.error?.message ?? '';
          if (msg.includes('INVALID_PASSWORD') || msg.includes('EMAIL_NOT_FOUND') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
            throw ApiError.unauthorized('Invalid email or password');
          }
          logger.error('Firebase signin error', err?.response?.data);
          throw ApiError.unauthorized('Authentication failed');
        }
      }
    } else {
      throw ApiError.badRequest('Provide email + password or a firebaseToken');
    }

    let user = await userRepository.findByFirebaseUid(uid);

    // Auto-register on first login — covers Google Sign-In and Phone OTP, where
    // there's no separate "register" step; the Firebase token itself is proof of identity.
    if (!user) {
      const email = (payload.email ?? decoded?.email ?? placeholderEmail(uid))?.toLowerCase();
      const name = decoded?.name
        ?? (decoded?.email ? decoded.email.split('@')[0] : payload.email?.split('@')[0])
        ?? decoded?.phone_number
        ?? 'User';

      user = await userRepository.create({
        firebaseUid:  uid,
        name,
        email,
        phoneNumber:  decoded?.phone_number,
        authProvider: decoded ? inferAuthProvider(decoded) : 'password',
        avatar:       decoded?.picture,
        allergies:    [],
        profileComplete: false,
      });
    }

    if (!user) throw ApiError.notFound('User not found. Please register first.');

    const tokens = await authService.generateTokenPair(user);
    return { user, ...tokens };
  },

  async refreshTokens(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) throw ApiError.unauthorized('Refresh token has been revoked');

    // Rotate refresh token
    await RefreshToken.deleteOne({ token: refreshToken });
    const user = await userRepository.findById(payload.userId);
    if (!user) throw ApiError.unauthorized('User not found');

    return authService.generateTokenPair(user);
  },

  async logout(refreshToken: string) {
    await RefreshToken.deleteOne({ token: refreshToken });
  },

  async generateTokenPair(user: IUser) {
    const tokenPayload = { userId: String(user._id), email: user.email };
    const accessToken  = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt });

    return { accessToken, refreshToken, expiresIn: 15 * 60 }; // 15 min in seconds
  },
};
