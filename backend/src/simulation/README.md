# Simulation Engine

The Simulation Engine is an internal-only developer and administrator tool for balancing PvP, ally stats, cash rewards, economy flow, and win probability. It never queries or writes the production database; every public API uses caller-provided data and cloned in-memory state.

## Public API

`SimulationService` exposes:

- `simulateBattle(attackerStats, defenderStats, iterations, options?)`
- `simulateEconomy(players, jobsPerDay, attacksPerDay, days, options?)`
- `simulateJobIncome(players, days, options?)`
- `simulatePvpEconomy(players, attacks, options?)`
- `simulateAllyBalance(options?)`

`options.seed` enables deterministic mode. Running a simulation with the same inputs and seed produces the same win/loss and economy outcomes, except for measured timing fields.

`options.action` can be set to:

- `balanced` (default): compare `power + smartness`.
- `punch`: compare `power` only.
- `face-off`: compare `smartness` only.

`options.balance` allows callers to override alpha balance values for simulation runs without editing business logic:

- `battleRating`
- `stealRate`
- `defaultJobRewardCash`
- `minimumWinProbability`
- `maximumWinProbability`

## Example

```ts
const service = new SimulationService();
const report = service.simulateBattle(
  { power: 30, smartness: 20, cash: 1_000 },
  { power: 20, smartness: 10, cash: 2_000 },
  100_000,
  { seed: 12345 },
);
```

Example report:

```json
{
  "winRate": 61.4,
  "averageCashWon": 214,
  "averageCashLost": 198,
  "battles": 100000,
  "averageDurationMs": 0.03
}
```

## Running the example script

```bash
cd backend
npm run simulate:example
```

## Running tests and benchmarks

```bash
cd backend
npm test
npm run test:benchmark
```

## Extension points

The service is intentionally pure and data-driven so later simulations can add optional modifiers for equipment, tutors, clubs, items, events, buffs, debuffs, and premium effects. Future public methods such as `simulateSeason`, `simulateTournament`, `simulateEvent`, `simulateMarket`, `simulateInflation`, and `simulateEntireGameWorld` can reuse the seeded random source and in-memory report patterns.
