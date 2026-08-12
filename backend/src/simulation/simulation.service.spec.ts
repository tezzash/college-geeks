import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
    assert.deepEqual(
      { ...second, averageDurationMs: 0 },
      { ...first, averageDurationMs: 0 },
    );
    assert.equal(first.attackerWins + first.defenderWins, 10_000);
    assert.equal(first.averageProbability, 62.5);
  });

  it('supports random mode without a seed', () => {
    const result = service.simulateBattle(attacker, defender, 100);
    assert.equal(result.battles, 100);
    assert.ok(result.winRate >= 0 && result.winRate <= 100);
  });

  it('handles zero combat stats as an even battle', () => {
    const result = service.simulateBattle({ power: 0, smartness: 0 }, { power: 0, smartness: 0 }, 1_000, { seed: 1 });
    assert.equal(result.averageProbability, 50);
  });

  it('supports action-specific combat probabilities', () => {
    const powerSpecialist = { power: 90, smartness: 10 };
    const smartnessSpecialist = { power: 10, smartness: 90 };

    assert.equal(service.simulateBattle(powerSpecialist, smartnessSpecialist, 10, { action: 'punch' }).averageProbability, 90);
    assert.equal(service.simulateBattle(powerSpecialist, smartnessSpecialist, 10, { action: 'face-off' }).averageProbability, 10);
    assert.equal(service.simulateBattle(powerSpecialist, smartnessSpecialist, 10).averageProbability, 50);
  });

  it('uses caller-provided balance values instead of fixed production assumptions', () => {
    const result = service.simulateBattle(attacker, defender, 1, {
      balance: { battleRating: 1, stealRate: 0.1, minimumWinProbability: 0, maximumWinProbability: 1 },
      seed: 1,
    });

    assert.equal(result.averageCashWon, 200);
  });

  it('rejects invalid battle inputs', () => {
    assert.throws(() => service.simulateBattle({ power: -1, smartness: 0 }, defender, 1), /attackerStats/);
    assert.throws(() => service.simulateBattle(attacker, defender, 0), /iterations/);
    assert.throws(() => service.simulateBattle(attacker, defender, 1, { balance: { stealRate: -1 } }), /Balance/);
  });

  it('simulates economy without mutating caller data', () => {
    const input = players();
    const snapshot = structuredClone(input);
    const result = service.simulateEconomy(input, 2, 5, 3, { seed: 7 });
    assert.deepEqual(input, snapshot);
    assert.equal(result.totalMoneyCreated, 1_980);
    assert.ok(result.totalMoneyTransferred >= 0);
    assert.ok(result.richestPlayer.cash >= result.poorestPlayer.cash);
  });

  it('rejects invalid economy inputs', () => {
    assert.throws(() => service.simulateEconomy([], 1, 1, 1), /players/);
    assert.throws(() => service.simulateEconomy(players(), -1, 1, 1), /jobsPerDay/);
    assert.throws(() => service.simulateEconomy(players(), 1, 1, 0), /days/);
  });

  it('creates configurable job income without PvP transfers', () => {
    const result = service.simulateJobIncome(players(), 2, { jobsPerDay: 3 });
    assert.equal(result.totalMoneyCreated, 1_980);
    assert.equal(result.totalMoneyTransferred, 0);
    assert.equal(result.averagePlayerCash, (1_600 + 2_900 + 980) / 3);
  });

  it('allows zero jobs per day', () => {
    assert.equal(service.simulateJobIncome(players(), 2, { jobsPerDay: 0 }).totalMoneyCreated, 0);
  });

  it('uses configurable default job rewards when players omit their own reward', () => {
    const result = service.simulateJobIncome([{ id: 'a', power: 1, smartness: 1, cash: 0 }], 2, {
      jobsPerDay: 3,
      balance: { defaultJobRewardCash: 25 },
    });

    assert.equal(result.totalMoneyCreated, 150);
  });

  it('transfers existing money without creating cash', () => {
    const result = service.simulatePvpEconomy(players(), 100, { seed: 99 });
    assert.equal(result.totalMoneyCreated, 0);
    assert.ok(result.totalMoneyTransferred > 0);
    assert.equal(Math.round(result.averagePlayerCash * 100) / 100, Math.round((3_500 / 3) * 100) / 100);
  });

  it('requires two players when attacks are requested', () => {
    assert.throws(() => service.simulatePvpEconomy([players()[0]], 1), /At least two players/);
    assert.equal(service.simulatePvpEconomy([players()[0]], 0).totalMoneyTransferred, 0);
  });

  it('returns a balance report for each built-in ally', () => {
    const result = service.simulateAllyBalance({ seed: 42 });
    assert.equal(result.length, 4);
    assert.equal(result[0].ally.name, 'Alex');
    assert.ok(result.every((ally) => Math.abs(ally.winPercent + ally.lossPercent - 100) < 0.000001));
  });
});
