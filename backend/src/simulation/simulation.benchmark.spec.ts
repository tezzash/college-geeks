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

  it("runs 100,000 unseeded battles within the benchmark budget", () => {
    const service = new SimulationService();
    const result = service.simulateBattle(
      { power: 35, smartness: 25, cash: 1_500 },
      { power: 28, smartness: 28, cash: 1_200 },
      100_000,
    );

    assert.equal(result.battles, 100_000);
    assert.ok(
      result.averageDurationMs < 0.05,
      `averageDurationMs was ${result.averageDurationMs}`,
    );
  });
});
