# Security Checklist

Use this checklist before any public Alpha release.

## Authentication

- Hash passwords with Argon2id or bcrypt.
- Enforce unique normalized usernames and emails.
- Rate-limit register, login, password reset, chat, and PvP endpoints.
- Use short-lived access tokens and rotate refresh tokens if refresh tokens are added.
- Store secrets only in environment-managed secret stores.

## Server Authority

- Never trust client-supplied cash, stats, energy, room ownership, or ally ownership.
- Recalculate stats on the backend through the Stat Engine.
- Spend and regenerate energy on the backend through the Energy Engine.
- Resolve PvP on the backend through the Combat Engine.

## Wallet and Economy

- Route every cash movement through the Wallet Engine.
- Wrap wallet updates in database transactions.
- Write a cash transaction ledger entry for every cash change.
- Use idempotency keys for job collection, purchases, and other retryable money actions.
- Reject any operation that would create a negative cash balance.

## PvP

- Prevent self-attacks.
- Verify attacker and defender status before combat.
- Lock attacker and defender rows, or equivalent wallet rows, during PvP settlement.
- Deduct energy and transfer cash in the same transaction as the battle record.
- Detect repeated attacks and bot-like behavior.

## Chat

- Authenticate Socket.IO connections.
- Limit message length and send rate.
- Escape or sanitize all user-generated content before display.
- Add block, report, mute, and admin moderation flows.

## Dependencies and CI

- Commit package lockfiles.
- Run typecheck, tests, dependency audit, and migration checks in CI.
- Block merges when security checks fail.
