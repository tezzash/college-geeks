import { PlayerStats, StatAlly } from './stats.types';

export class StatsService {
  calculate(allies: StatAlly[]): PlayerStats {
    if (!Array.isArray(allies)) throw new Error('allies must be an array.');
    return allies.reduce<PlayerStats>((totals, ally, index) => {
      this.validateAlly(ally, index);
      return {
        power: totals.power + ally.power,
        smartness: totals.smartness + ally.smartness,
      };
    }, { power: 0, smartness: 0 });
  }

  private validateAlly(ally: StatAlly, index: number): void {
    if (!ally || !Number.isFinite(ally.power) || !Number.isFinite(ally.smartness) || ally.power < 0 || ally.smartness < 0) {
      throw new Error(`allies[${index}] must include non-negative finite power and smartness.`);
    }
  }
}
