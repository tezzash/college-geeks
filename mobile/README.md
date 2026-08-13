# College Geeks Flutter client

This is the mobile MVP for the College Geeks backend.

## Run

Install Flutter, then from `mobile/` run:

```bash
flutter pub get
flutter run --dart-define=API_URL=http://localhost:3000
```

For an Android emulator, the host machine is usually `http://10.0.2.2:3000`.

## Current screens

- Login / registration
- Home dashboard with cash, energy, Power and Smartness
- Jobs: list, start and collect
- Tower / Allies placeholder cards
- PvP: choose Punch or Face-off and submit a defender ID

The client stores the access token locally and restores the session on launch.
