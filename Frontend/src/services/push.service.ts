// services/push.service.ts — Native FCM push registration (Capacitor)

import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token } from '@capacitor/push-notifications';
import { userApi } from '../api/user.api';
import { notificationService } from './notification.service';

/**
 * Native push registration for the Capacitor shell.
 *
 * On the web this is a no-op: `Capacitor.isNativePlatform()` is false under
 * `npm run dev`, so the browser build never touches the plugin and keeps
 * running exactly as before.
 */

let registered = false;

/**
 * Requests notification permission and registers with FCM.
 *
 * Resolves to the native FCM token, or null when push is unavailable
 * (web build) or the user denied permission. Safe to call more than once —
 * registration only runs on the first call.
 */
export async function registerPush(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (registered) return null;
  registered = true;

  // Android 13+ (API 33) requires the runtime POST_NOTIFICATIONS grant;
  // on older versions checkPermissions() already reports 'granted'.
  let status = await PushNotifications.checkPermissions();
  if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
    status = await PushNotifications.requestPermissions();
  }
  if (status.receive !== 'granted') {
    registered = false;
    return null;
  }

  return new Promise<string | null>((resolve) => {
    // 'registration' fires with the FCM token once the device registers.
    PushNotifications.addListener('registration', (token: Token) => {
      syncToken(token.value);
      resolve(token.value);
    });

    PushNotifications.addListener('registrationError', () => {
      registered = false;
      resolve(null);
    });

    PushNotifications.register();
  });
}

/**
 * Sends the device token to the backend so meal/water/goal/streak reminders
 * can target this device. Failures are non-critical — the app works without
 * push, and registration retries on next launch.
 */
async function syncToken(token: string): Promise<void> {
  try {
    await userApi.updateFcmToken(token);
  } catch {
    /* non-critical — reminders simply won't reach this device yet */
  }
}

/**
 * Foreground + tap handlers. A push arriving while the app is open does not
 * raise a system tray notification on Android, so surface it as an in-app
 * toast to match how the app already reports things.
 */
export function addPushListeners(): void {
  if (!Capacitor.isNativePlatform()) return;

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const text = notification.body ?? notification.title;
    if (text) notificationService.info(text);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', () => {
    /* reserved for deep-linking once reminder payloads carry a route */
  });
}

/**
 * Called once at app startup. Registers listeners before registering for push
 * so no early token/message is missed.
 */
export async function initPush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  addPushListeners();
  await registerPush();
}
