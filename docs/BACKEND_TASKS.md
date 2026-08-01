# Backend Implementation Tasks

This plan breaks the College Geeks backend MVP into implementation sprints. The order is backend-first and assumes a server-authoritative NestJS API backed by PostgreSQL, Prisma, JWT authentication, and Socket.IO.

## Sprint 0: Backend Foundation

### Objectives
- Scaffold the NestJS backend application and establish project conventions.
- Configure local development infrastructure for PostgreSQL and Prisma.
- Create baseline health checks, configuration handling, validation, and error response patterns.

### Deliverables
- NestJS project structure with modular boundaries for auth, player, tower, jobs, PvP, leaderboard, chat, and shared utilities.
- Environment configuration schema for database connection, JWT secrets, CORS, ports, and economy constants.
- PostgreSQL local development setup and Prisma initialization.
- Health check endpoint and standardized API response envelope.
- Base linting, formatting, unit test, and integration test commands documented in the backend README.

### Dependencies
- Technical architecture and API response conventions.
- PostgreSQL availability for local development and CI.
- Agreement on environment variable names and secret management approach.

### Estimated effort
- 2-3 engineering days.

## Sprint 1: Database Schema and Seed Data

### Objectives
- Translate the documented data model into a Prisma schema.
- Create initial migrations and deterministic seed data for MVP gameplay.
- Preserve economy values as configurable data instead of hardcoded business logic.

### Deliverables
- Prisma models for players, tower rooms, allies, room occupants, jobs, active jobs, battles, and cash transactions.
- Database migrations for all MVP tables, indexes, relationships, and constraints.
- Seed data for starter jobs, ally tiers, tower room unlock costs, and default economy configuration.
- Repository or service layer helpers for common player, cash transaction, and stat aggregation queries.
- Migration and seed verification instructions.

### Dependencies
- Sprint 0 foundation.
- Finalized core table names and relationship semantics.
- Confirmed starting economy values: starting cash, max energy, energy regeneration, and PvP steal calculations.

### Estimated effort
- 3-4 engineering days.

## Sprint 2: Authentication and Player Profile

### Objectives
- Implement account registration, login, current-user lookup, and player profile retrieval.
- Initialize each new player with starting resources and default progression state.
- Establish authentication guards for protected API routes.

### Deliverables
- `POST /auth/register`, `POST /auth/login`, and `GET /auth/me` endpoints.
- Password hashing, JWT issuance, JWT validation, and authenticated request context.
- Player creation flow that grants starting cash, max energy, and initial tower state.
- `GET /player/profile` and `GET /player/stats` endpoints.
- Unit and integration tests covering registration, login, duplicate accounts, invalid credentials, and authenticated profile access.

### Dependencies
- Sprint 1 database schema and migrations.
- JWT secret and token expiration configuration.
- Validated requirements for unique usernames and emails.

### Estimated effort
- 4-5 engineering days.

## Sprint 3: Economy, Energy, and Transaction Services

### Objectives
- Centralize money movement, energy regeneration, and configurable economy calculations.
- Ensure all gameplay systems consume shared services for cash, energy, and audit records.
- Make the server authoritative for resource validation and updates.

### Deliverables
- Cash transaction service with atomic debit, credit, affordability, and audit behaviors.
- Energy service that computes regeneration from `last_energy_update`, caps energy at max, and applies PvP costs.
- Economy configuration access layer for starting values, room costs, ally costs, job rewards, and PvP formulas.
- Shared domain errors for insufficient cash, insufficient energy, missing resources, and invalid state transitions.
- Tests covering race-sensitive updates, transaction records, and energy regeneration edge cases.

### Dependencies
- Sprint 1 database schema.
- Sprint 2 authenticated player context.
- Confirmed policy that all configurable values remain outside hardcoded business logic.

### Estimated effort
- 4-6 engineering days.

## Sprint 4: Tower and Allies

### Objectives
- Implement tower progression and ally hiring as the primary non-PvP progression system.
- Calculate player power and smartness from hired allies assigned to unlocked rooms.
- Enforce unlock costs, room availability, and ally hiring rules server-side.

### Deliverables
- `GET /tower`, `POST /tower/unlock-room`, and `POST /tower/hire-ally` endpoints.
- Tower state response including unlocked rooms, locked rooms, occupants, available allies, and next unlock costs.
- Room unlock flow that debits cash and records a cash transaction.
- Ally hiring flow that validates room capacity, debits cash, assigns occupants, and updates derived stats.
- Tests for room unlocks, duplicate unlock prevention, insufficient cash, ally assignment, and stat aggregation.

### Dependencies
- Sprint 3 cash transaction and economy services.
- Seeded tower room and ally configuration.
- Finalized room capacity rules for MVP.

### Estimated effort
- 5-6 engineering days.

## Sprint 5: Jobs

### Objectives
- Implement time-based jobs that create cash for players.
- Prevent duplicate collection and enforce job completion timing.
- Integrate job rewards with the shared cash transaction service.

### Deliverables
- `GET /jobs`, `POST /jobs/start`, and `POST /jobs/collect` endpoints.
- Active job lifecycle: start, pending, completed, collected.
- Server-side finish time calculation from configured job duration.
- Cash reward distribution and transaction audit on collection.
- Tests for starting jobs, collecting too early, collecting once, and reward accounting.

### Dependencies
- Sprint 3 cash transaction service.
- Seeded job definitions.
- Authenticated player context from Sprint 2.

### Estimated effort
- 3-4 engineering days.

## Sprint 6: PvP Battles

### Objectives
- Implement server-authoritative PvP opponent discovery and battle actions.
- Apply power and smartness comparisons for Punch and Face Off actions.
- Redistribute cash according to configurable PvP economy rules.

### Deliverables
- `GET /pvp/opponents`, `POST /pvp/punch`, `POST /pvp/face-off`, and `GET /pvp/history` endpoints.
- Opponent selection query that excludes the current player and returns useful battle preview data.
- Battle resolution service for Punch and Face Off using current derived stats.
- Energy spend, cash steal calculation, battle persistence, and cash transaction records.
- Tests for successful attacks, failed attacks, energy cost enforcement, cash steal caps, and battle history visibility.

### Dependencies
- Sprint 3 energy and cash services.
- Sprint 4 derived power and smartness stats.
- Confirmed PvP formulas and MVP battle rating.

### Estimated effort
- 5-7 engineering days.

## Sprint 7: Leaderboards and Chat

### Objectives
- Add social and competitive MVP features after core progression systems are stable.
- Provide global rankings and global chat persistence with optional real-time delivery.
- Keep moderation and abuse-prevention hooks visible for future work.

### Deliverables
- `GET /leaderboard` endpoint ranked by agreed MVP metric, such as cash, power, smartness, or composite score.
- `GET /chat/messages` and `POST /chat/send` endpoints.
- Socket.IO gateway for broadcasting new global chat messages.
- Chat persistence model or agreed extension to the Prisma schema if not already included.
- Basic message validation, length limits, timestamps, and sender metadata.
- Tests for leaderboard ordering, chat message creation, message retrieval, and websocket broadcast behavior where practical.

### Dependencies
- Sprint 2 authenticated player context.
- Sprint 4 stat aggregation if rankings use power or smartness.
- Product decision on the initial leaderboard metric.
- Decision on chat retention and moderation requirements.

### Estimated effort
- 4-6 engineering days.

## Sprint 8: API Hardening and Observability

### Objectives
- Prepare the MVP backend for client integration and production-like environments.
- Improve reliability, traceability, and operational confidence.
- Validate that documented API contracts match implementation behavior.

### Deliverables
- Request validation and serialization review across all endpoints.
- Rate limiting or throttling for auth, PvP, and chat endpoints.
- Structured logging, request IDs, and error logging.
- OpenAPI or generated API documentation synchronized with the implemented routes.
- End-to-end smoke test suite covering the full gameplay loop: register, run jobs, unlock room, hire ally, battle, chat, and leaderboard.
- Deployment checklist for environment variables, migrations, seeds, and rollback steps.

### Dependencies
- Sprints 2-7 endpoint implementations.
- Client integration feedback from the Flutter app.
- Target deployment environment details.

### Estimated effort
- 4-5 engineering days.

## Suggested Sprint Cadence

- Use one-week sprints for Sprints 0-3 because they establish architecture and shared services.
- Use one- to two-week sprints for Sprints 4-8 depending on team size, QA depth, and frontend integration needs.
- Keep each sprint shippable behind stable API contracts, even when the Flutter client is not yet consuming every endpoint.
