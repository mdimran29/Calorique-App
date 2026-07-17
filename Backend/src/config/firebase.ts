// src/config/firebase.ts — Firebase Admin SDK initialization
import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

export function initFirebase(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey?.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY is not a valid service-account private key. ' +
      'It looks like a Web API key or auth domain may have been pasted instead. ' +
      'Get the real value from Firebase Console → Project Settings → Service Accounts → Generate new private key.'
    );
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL?.includes('.iam.gserviceaccount.com')) {
    throw new Error(
      'FIREBASE_CLIENT_EMAIL is not a valid service-account client email ' +
      '(expected something ending in .iam.gserviceaccount.com). ' +
      'Get it from the same service-account JSON as FIREBASE_PRIVATE_KEY.'
    );
  }

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
