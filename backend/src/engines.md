# Core Engine Contracts

These dependency-light services establish the backend-only gameplay boundaries before player-facing APIs are added.

## Config Engine

`GameConfigService` owns versioned alpha gameplay values such as starting cash, energy rules, steal rate, battle rating, and win-probability caps.

## Wallet Engine

`WalletService` is the only contract that should create, remove, or transfer cash. Production persistence must wrap equivalent operations in database transactions and write `cash_transactions` rows.

## Stat Engine

`StatsService` calculates Power and Smartness from equipped/hired allies. Player total stats should not be stored directly on `players`.

## Energy Engine

`EnergyService` regenerates energy from `lastEnergyUpdate` and spends configured PvP energy cost before combat is settled.

## Combat Engine

`CombatService` resolves Punch with Power and Face Off with Smartness. It returns outcomes only; callers must coordinate wallet and energy changes through their own engines.
