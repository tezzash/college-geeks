import { SimulationService } from '../src/simulation';

const simulation = new SimulationService();

const battleReport = simulation.simulateBattle(
  { name: 'Attacker', power: 32, smartness: 24, cash: 1_200 },
  { name: 'Defender', power: 25, smartness: 21, cash: 1_800 },
  100_000,
  { seed: 12345 },
);

const economyReport = simulation.simulateEconomy(
  [
    { id: 'alex', name: 'Alex', power: 24, smartness: 16, cash: 1_000, jobRewardCash: 120 },
    { id: 'miranda', name: 'Miranda', power: 14, smartness: 28, cash: 1_000, jobRewardCash: 140 },
    { id: 'maze', name: 'Maze', power: 21, smartness: 21, cash: 1_000, jobRewardCash: 100 },
  ],
  3,
  10,
  7,
  { seed: 12345 },
);

console.log(JSON.stringify({ battleReport, economyReport }, null, 2));
