import { GameConfig } from '../game-config';
import { CombatAction, CombatResult, CombatStats } from './combat.types';

type RandomSource = () => number;

export class CombatService {
  constructor(private readonly config: Pick<GameConfig, 'minWinProbability' | 'maxWinProbability'>, private readonly random: RandomSource = Math.random) {}

  resolve(action: CombatAction, attacker: CombatStats, defender: CombatStats): CombatResult {
    this.validateStats(attacker, 'attacker');
    this.validateStats(defender, 'defender');
    const winProbability = this.calculateWinProbability(action, attacker, defender);
    return {
      action,
      success: this.random() < winProbability,
      winProbability,
    };
  }

  calculateWinProbability(action: CombatAction, attacker: CombatStats, defender: CombatStats): number {
    const attackerScore = this.score(action, attacker);
    const defenderScore = this.score(action, defender);
    if (attackerScore + defenderScore === 0) return 0.5;
    return Math.min(
      this.config.maxWinProbability,
      Math.max(this.config.minWinProbability, attackerScore / (attackerScore + defenderScore)),
    );
  }

  private score(action: CombatAction, stats: CombatStats): number {
    return action === 'punch' ? stats.power : stats.smartness;
  }

  private validateStats(stats: CombatStats, name: string): void {
    if (!stats || !Number.isFinite(stats.power) || !Number.isFinite(stats.smartness) || stats.power < 0 || stats.smartness < 0) {
      throw new Error(`${name} stats must include non-negative finite power and smartness.`);
    }
  }
}
