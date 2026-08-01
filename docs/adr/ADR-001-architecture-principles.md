# ADR-001: Core Architecture Principles

Status: Accepted

## Decisions

1. No XP system.
2. No player levels.
3. Player progression comes from Tower expansion and Allies.
4. Power and Smartness are the only combat stats for Alpha.
5. Stats are calculated by the Stat Engine and are never stored as player totals.
6. All business logic resides on the backend.
7. Flutter is a presentation layer only.
8. Every cash movement goes through the Wallet Engine.
9. Every gameplay value is configurable and should not be hardcoded.
10. Jobs create money; PvP redistributes money.
11. Combat coordinates gameplay but does not directly modify wallet, energy, or stats.
12. Future systems (Bank, Items, Clubs, Parties, Events) must extend existing engines instead of replacing them.

## Rationale
These principles provide a stable architectural foundation that allows the game to evolve while minimizing rewrites and technical debt.
