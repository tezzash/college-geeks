import { GameConfig } from './game-config.types';

export const ALPHA_GAME_CONFIG: GameConfig = Object.freeze({
  version: 'alpha-0.1',
  startingCash: 1_000,
  maxEnergy: 10,
  energyRegenSeconds: 7 * 60,
  pvpEnergyCost: 1,
  stealRate: 0.05,
  battleRating: 0.5,
  minWinProbability: 0.05,
  maxWinProbability: 0.95,
});

export class GameConfigService {
  constructor(private readonly config: GameConfig = ALPHA_GAME_CONFIG) {
    this.validate(config);
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  private validate(config: GameConfig): void {
    if (!config.version.trim()) throw new Error('Game config version is required.');
    const nonNegativeFields: Array<keyof GameConfig> = [
      'startingCash',
      'maxEnergy',
      'energyRegenSeconds',
      'pvpEnergyCost',
      'stealRate',
      'battleRating',
      'minWinProbability',
      'maxWinProbability',
    ];
    for (const field of nonNegativeFields) {
      if (typeof config[field] !== 'number' || !Number.isFinite(config[field]) || config[field] < 0) {
        throw new Error(`${field} must be a non-negative finite number.`);
      }
    }
    if (!Number.isInteger(config.maxEnergy) || !Number.isInteger(config.energyRegenSeconds) || !Number.isInteger(config.pvpEnergyCost)) {
      throw new Error('Energy values must be integers.');
    }
    if (config.minWinProbability > config.maxWinProbability || config.maxWinProbability > 1) {
      throw new Error('Win probability bounds must be ordered and at most 1.');
    }
  }
}
