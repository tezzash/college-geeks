# Implementation Roadmap

This roadmap turns the current design documents into an implementation sequence for a working Alpha app.

## Phase 1: Backend Foundation

- Scaffold the NestJS application shell.
- Add Prisma and PostgreSQL/Supabase connectivity.
- Add typed environment configuration with startup validation.
- Add CI checks for typecheck, tests, dependency audit, and Prisma migrations.
- Commit lockfiles for reproducible installs.

## Phase 2: Core Engines

Build these backend modules before exposing gameplay endpoints:

1. Config Engine: owns versioned gameplay values.
2. Wallet Engine: owns every cash movement and ledger entry.
3. Stat Engine: calculates player power and smartness from tower rooms and allies.
4. Energy Engine: regenerates and spends PvP energy.
5. Combat Engine: resolves Punch and Face Off without directly mutating cash, energy, or stats.

## Phase 3: MVP API Modules

- Authentication.
- Player profile and stats.
- Tower room unlocking.
- Ally hiring.
- Jobs start and collect.
- PvP opponent search, Punch, Face Off, and battle history.
- Leaderboards.
- Authenticated global chat.

## Phase 4: Flutter Client

- Authentication screens.
- Player dashboard.
- Tower and ally management.
- Jobs flow.
- PvP flow.
- Leaderboards.
- Global chat.

## Phase 5: Hardening

- Add rate limiting and abuse prevention.
- Add audit logs for auth, wallet, jobs, PvP, and moderation.
- Add end-to-end tests for all MVP user flows.
- Add load tests for PvP and chat.
- Add database backup and restore procedures.
- Add production monitoring and alerting.
