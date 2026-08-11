import { SimulationService } from './simulation.service';
import { EconomyPlayer } from './simulation.types';

describe('SimulationService', () => {
  const service = new SimulationService();
  const attacker = { power: 30, smartness: 20, cash: 1_000 };
  const defender = { power: 20, smartness: 10, cash: 2_000 };
  const players = (): EconomyPlayer[] => [
    { id: 'a', power: 30, smartness: 10, cash: 1_000, jobRewardCash: 100 },
    { id: 'b', power: 10, smartness: 30, cash: 2_000, jobRewardCash: 150 },
    { id: 'c', power: 20, smartness: 20, cash: 500, jobRewardCash: 80 },
  ];

  it('returns deterministic battle results for the same seed', () => {
    const first = service.simulateBattle(attacker, defender, 10_000, { seed: 12345 });
    const second = service.simulateBattle(attacker, defender, 10_000, { seed: 12345 });
    expect({ ...second, averageDurationMs: 0 }).toEqual({ ...first, averageDurationMs: 0 });
    expect(first.attackerWins + first.defenderWins).toEqual(10_000);
    expect(first.averageProbability).toEqual(62.5);
  });

  it('supports random mode without a seed', () => {
    const result = service.simulateBattle(attacker, defender, 100);
    expect(result.battles).toEqual(100);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(100);
  });

  it('handles zero combat stats as an even battle', () => {
    const result = service.simulateBattle({ power: 0, smartness: 0 }, { power: 0, smartness: 0 }, 1_000, { seed: 1 });
    expect(result.averageProbability).toEqual(50);
  });

  it('rejects invalid battle inputs', () => {
    expect(() => service.simulateBattle({ power: -1, smartness: 0 }, defender, 1)).toThrow(/attackerStats/);
    expect(() => service.simulateBattle(attacker, defender, 0)).toThrow(/iterations/);
  });

  it('simulates economy without mutating caller data', () => {
    const input = players();
    const snapshot = structuredClone(input);
    const result = service.simulateEconomy(input, 2, 5, 3, { seed: 7 });
    expect(input).toEqual(snapshot);
    expect(result.totalMoneyCreated).toEqual(1_980);
    expect(result.totalMoneyTransferred).toBeGreaterThanOrEqual(0);
    expect(result.richestPlayer.cash).toBeGreaterThanOrEqual(result.poorestPlayer.cash);
  });

  it('rejects invalid economy inputs', () => {
    expect(() => service.simulateEconomy([], 1, 1, 1)).toThrow(/players/);
    expect(() => service.simulateEconomy(players(), -1, 1, 1)).toThrow(/jobsPerDay/);
    expect(() => service.simulateEconomy(players(), 1, 1, 0)).toThrow(/days/);
  });

  it('creates configurable job income without PvP transfers', () => {
    const result = service.simulateJobIncome(players(), 2, { jobsPerDay: 3 });
    expect(result.totalMoneyCreated).toEqual(1_980);
    expect(result.totalMoneyTransferred).toEqual(0);
    expect(result.averagePlayerCash).toEqual((1_600 + 2_900 + 980) / 3);
  });

  it('allows zero jobs per day', () => {
    expect(service.simulateJobIncome(players(), 2, { jobsPerDay: 0 }).totalMoneyCreated).toEqual(0);
  });

  it('transfers existing money without creating cash', () => {
    const result = service.simulatePvpEconomy(players(), 100, { seed: 99 });
    expect(result.totalMoneyCreated).toEqual(0);
    expect(result.totalMoneyTransferred).toBeGreaterThan(0);
    expect(Math.round(result.averagePlayerCash * 100) / 100).toEqual(Math.round((3_500 / 3) * 100) / 100);
  });

  it('requires two players when attacks are requested', () => {
    expect(() => service.simulatePvpEconomy([players()[0]], 1)).toThrow(/At least two players/);
    expect(service.simulatePvpEconomy([players()[0]], 0).totalMoneyTransferred).toEqual(0);
  });

  it('returns a balance report for each built-in ally', () => {
    const result = service.simulateAllyBalance({ seed: 42 });
    expect(result.length).toEqual(4);
    expect(result[0].ally.name).toEqual('Alex');
    expect(result.every((ally) => Math.abs(ally.winPercent + ally.lossPercent - 100) < 0.000001)).toBe(true);
  });
});
