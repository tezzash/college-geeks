export type CombatAction = 'punch' | 'face-off';

export interface CombatStats {
  power: number;
  smartness: number;
}

export interface CombatResult {
  action: CombatAction;
  success: boolean;
  winProbability: number;
}
