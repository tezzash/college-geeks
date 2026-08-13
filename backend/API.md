# College Geeks REST API

The backend exposes a JSON REST API for the Flutter client. Start it with `npm start` after configuring PostgreSQL and `DATABASE_URL`.

## Configuration

- `PORT` — HTTP port, default `3000`
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — secret used to sign access tokens; production requires it and it must be at least 32 characters
- `CORS_ORIGIN` — allowed browser origin

## Authentication

Register with `POST /auth/register`:

```json
{"username":"alice","email":"alice@example.com","password":"password123"}
```

Login with `POST /auth/login`:

```json
{"login":"alice","password":"password123"}
```

Both return `{ "player": ..., "accessToken": "..." }`.

Send the token on protected endpoints with `Authorization: Bearer <accessToken>`.

## Gameplay endpoints

- `GET /health` — public health check
- `GET /me` — authenticated player state
- `GET /players?q=...` — search opponents
- `GET /jobs` — list jobs
- `GET /jobs/active` — current player's active job
- `POST /jobs/:jobId/start` — start a job
- `POST /jobs/active/:activeJobId/collect` — collect a completed job
- `GET /tower` — current player's tower rooms
- `POST /tower/unlock` — unlock a room by `roomNumber`
- `GET /allies` — list allies
- `POST /allies/hire` — hire an ally into a tower room
- `POST /battles` — fight with `{ "defenderId": "...", "action": "punch" | "face_off" }`

All gameplay state is backed by PostgreSQL through Prisma.
