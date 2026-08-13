# College Geeks Web Preview

The Flutter client can run as a web app for quick browser testing.

## Run locally or in a cloud workspace

From `mobile/`:

```bash
flutter pub get
flutter run -d chrome --web-port 8080 --dart-define=API_URL=http://localhost:3000
```

For a hosted backend, replace `API_URL` with the public HTTPS API URL.

The backend must be running and reachable by the browser. The API should also allow the web origin with CORS.

## Build a static web bundle

```bash
flutter build web --release --dart-define=API_URL=https://YOUR-API-HOST
```

The deployable files are produced under `build/web/`.
