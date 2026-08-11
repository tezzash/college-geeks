import { SimulationService } from './simulation.service';

describe('SimulationService benchmark', () => {
  it('runs 100,000 seeded battles within the benchmark budget', () => {
    const service = new SimulationService();
    const result = service.simulateBattle(
      { power: 35, smartness: 25, cash: 1_500 },
      { power: 28, smartness: 28, cash: 1_200 },
      100_000,
      { seed: 20260801 },
    );

    expect(result.battles).toEqual(100_000);
    expect(result.averageDurationMs).toBeLessThan(0.05);
  });
});
