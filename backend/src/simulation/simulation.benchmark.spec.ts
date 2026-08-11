import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SimulationService } from "./simulation.service";

describe("SimulationService benchmark", () => {
  it("runs 100,000 seeded battles within the benchmark budget", () => {
    const service = new SimulationService();
    const result = service.simulateBattle(
      { power: 35, smartness: 25, cash: 1_500 },
      { power: 28, smartness: 28, cash: 1_200 },
      100_000,
      { seed: 20260801 },
    );

    assert.equal(result.battles, 100_000);
    assert.ok(
      result.averageDurationMs < 0.05,
      `averageDurationMs was ${result.averageDurationMs}`,
    );
  });

  it("runs createEconomyReport with 1,000,000 players efficiently", () => {
    const service = new SimulationService();
    const players = Array.from({ length: 1_000_000 }, (_, i) => ({
      id: `player_${i}`,
      power: 10,
      smartness: 10,
      cash: Math.random() * 1000,
    }));

    // warm up
    service.simulateJobIncome(
      [{ id: "a", power: 10, smartness: 10, cash: 100 }],
      1,
      { jobsPerDay: 1 },
    );

    const start = performance.now();
    service.simulateJobIncome(players, 1, { jobsPerDay: 1 });
    const end = performance.now();

    console.log(
      `after optimization: simulateJobIncome (1m players) took ${end - start} ms`,
    );
    assert.ok(end - start < 10000, `duration was ${end - start}`);
  });
});
