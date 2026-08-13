# Database setup

The backend now has a Prisma/PostgreSQL persistence layer for players, jobs, tower rooms, allies and PvP battles.

## Local setup

1. Install dependencies from `backend/`:

   `npm install`

2. Set `DATABASE_URL` to the PostgreSQL connection string.

3. Validate the Prisma schema:

   `npm run prisma:validate`

4. Create/apply the first migration for a new database:

   `npm run prisma:migrate -- --name init`

5. Generate Prisma Client:

   `npm run prisma:generate`

The repository intentionally does not contain a database password or connection string. Do not commit `.env` files or production credentials.

## Persistence boundary

`src/database/` contains the database-backed services. The existing pure game engines remain useful for deterministic unit tests, while database services handle transactions and durable state.

Cash mutations are recorded in `CashTransaction`, and PvP battles are recorded in `Battle` so important gameplay actions have an audit trail.
