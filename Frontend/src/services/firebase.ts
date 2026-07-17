import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy_api_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123:web:123"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

/**
 * Google Sign-In via popup. Returns a Firebase ID token to hand off to the backend
 * (POST /auth/login or /auth/register with { firebaseToken }).
 */
export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user.getIdToken();
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Lazily creates an invisible reCAPTCHA bound to the given container element.
 * Firebase Phone Auth requires this to prevent abuse — it's invisible to the user
 * unless Firebase's risk assessment flags the request.
 */
function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  }
  return recaptchaVerifier;
}

/**
 * Starts phone OTP verification. `phoneNumber` must be in E.164 format (e.g. +919876543210).
 * Returns a ConfirmationResult — pass the user's entered code to confirmOtp().
 */
export async function startPhoneSignIn(phoneNumber: string, recaptchaContainerId: string): Promise<ConfirmationResult> {
  const verifier = getRecaptchaVerifier(recaptchaContainerId);
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/**
 * Confirms the OTP code the user received via SMS. Returns a Firebase ID token
 * to hand off to the backend (POST /auth/login or /auth/register with { firebaseToken }).
 */
export async function confirmOtp(confirmation: ConfirmationResult, code: string): Promise<string> {
  const result = await confirmation.confirm(code);
  return result.user.getIdToken();
}

export function resetRecaptcha(): void {
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
}
