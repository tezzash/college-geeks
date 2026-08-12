export interface GameConfig {
  version: string;
  startingCash: number;
  maxEnergy: number;
  energyRegenSeconds: number;
  pvpEnergyCost: number;
  stealRate: number;
  battleRating: number;
  minWinProbability: number;
  maxWinProbability: number;
}
