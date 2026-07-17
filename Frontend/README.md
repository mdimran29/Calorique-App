
  # Build the app

  This is a code bundle for Build the app. The original project is available at https://www.figma.com/design/tAMj33wDjYycdIZRIhHniV/Build-the-app.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Native app (Android / iOS)

  The app is wrapped with Capacitor to ship natively. Build and sync with:

      npm run build && npx cap sync

  Then `npx cap open android` (or `npx cap run android`). See [CAPACITOR.md](CAPACITOR.md)
  for prerequisites, iOS setup, and push notification configuration.
  