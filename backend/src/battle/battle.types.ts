import { CombatAction, CombatResult } from '../combat';

export interface BattleResult extends CombatResult {
  attackerId: string;
  defenderId: string;
  energySpent: number;
  cashTransferred: number;
  attackerCash: number;
  defenderCash: number;
}
