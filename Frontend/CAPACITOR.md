# Capacitor — Native Android & iOS

The Calorique web app is wrapped with [Capacitor](https://capacitorjs.com) to ship as a
native Android and iOS app. The React app, routes, and API layer are unchanged — Capacitor
serves the Vite production build (`dist/`) inside a native WebView.

App name: **Calorique** · Bundle id: **com.calorique.app** · Config: `capacitor.config.ts`

## Build flow

The web build must exist before syncing — Capacitor copies `dist/` into the native project.

```bash
npm run build && npx cap sync
```

- `npm run build` — Vite production build → `dist/`
- `npx cap sync` — copies `dist/` into the native projects **and** updates native plugins

Run this after **every** web change, and after installing any Capacitor plugin.

Then open the native project:

```bash
npx cap open android    # opens Android Studio
npx cap run android     # build + install on a connected device/emulator
```

The plain web app is unaffected and still runs with:

```bash
npm run dev
```

## Prerequisites

Building the Android app needs a toolchain the web build does not:

- **JDK 21** (Android Gradle Plugin 8.x). E.g. `sudo apt install openjdk-21-jdk`
- **Android SDK** — via [Android Studio](https://developer.android.com/studio), or the
  command-line tools. Export `ANDROID_HOME` (typically `~/Android/Sdk`) and put
  `$ANDROID_HOME/platform-tools` on your `PATH`.

Verify with `java -version` and `adb --version`.

### iOS

iOS **requires macOS** with Xcode and CocoaPods — it cannot be added or built on Linux.
On a Mac, add the platform once with:

```bash
npm i @capacitor/ios
npx cap add ios
npm run build && npx cap sync
npx cap open ios
```

## Push notifications (native FCM)

Push uses `@capacitor/push-notifications`, which registers with **native FCM** rather than
web push. Registration lives in `src/services/push.service.ts` and is kicked off once from
`src/main.tsx`.

It is a **no-op on web** — `Capacitor.isNativePlatform()` is false under `npm run dev`, so
the browser build never touches the plugin.

On first launch in the native shell it:

1. Requests notification permission (Android 13+ needs the runtime `POST_NOTIFICATIONS` grant).
2. Registers with FCM and receives the device token.
3. `PUT /users/fcm-token` sends the token to the backend so reminders can target the device.

### Required Firebase setup

FCM registration will **fail at runtime without this**:

1. In the [Firebase Console](https://console.firebase.google.com), add an **Android app** to
   the project using bundle id `com.calorique.app`.
2. Download `google-services.json` and place it at `android/app/google-services.json`.

No Gradle edits are needed: `android/app/build.gradle` detects the file and applies the
`com.google.gms.google-services` plugin only when it is present (see the `servicesJSON`
block). Without the file the app still builds — Gradle just logs *"google-services.json not
found, google-services plugin not applied. Push Notifications won't work"* — which is why
push fails at runtime rather than at build time.

Note `android/.gitignore` lists `google-services.json` **commented out**, so the file will be
committed as-is. That's the Capacitor default; uncomment that line if you'd rather each
developer supply their own.

### Backend status

⚠️ The client sends its token to `PUT /users/fcm-token`, but **that endpoint does not exist
yet**. The `fcmToken` field is declared on the User model (`Backend/src/models/User.model.ts`)
but nothing reads or writes it, and the backend has no FCM sending code or reminder
scheduler. Until that is built, registration succeeds and the token POST fails silently
(non-critical, by design) — no reminder will actually deliver.

Still needed on the backend:

- `PUT /users/fcm-token` route → controller → service → repository, to persist the token.
- An FCM sender using `admin.messaging()` (only `admin.auth()` is used today).
- A `node-cron` scheduler for the meal/water/goal/streak reminders (`node-cron` is already a
  dependency but is never imported).
