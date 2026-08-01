export const COMBAT_DEFAULTS = {
  attackType: 'standard',
  energyCost: 10,
  performanceMultiplier: 0.5,
  maxStealRate: 0.05,
  minWinProbability: 0.05,
  maxWinProbability: 0.95,
} as const;

export interface BattleLogInput {
  attackerId: string;
  defenderId: string;
  attackType: string;
  success: boolean;
  cashStolen: number;
  probability: number;
  metadata?: Record<string, unknown>;
}

export interface BattleLog extends BattleLogInput {
  id: string;
  createdAt: Date;
}

export interface BattleResult {
  battleId: string;
  attackerId: string;
  defenderId: string;
  attackType: string;
  winnerId: string;
  loserId: string;
  success: boolean;
  winProbability: number;
  cashStolen: number;
  energySpent: number;
  createdAt: Date;
}

export interface GenerateBattleResultInput {
  attackerId: string;
  defenderId: string;
  attackType?: string;
  winProbability: number;
  cashReward: number;
  randomRoll?: number;
}
