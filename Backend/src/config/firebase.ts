// src/config/firebase.ts — Firebase Admin SDK initialization
import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

export function initFirebase(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  logger.info('✅ Firebase Admin SDK initialized');
  return firebaseApp;
}

export function getFirebaseAdmin(): typeof admin {
  if (!firebaseApp) initFirebase();
  return admin;
}
