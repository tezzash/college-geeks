import { CombatAction, CombatService } from '../combat';
import { GameConfig } from '../game-config';
import { PlayerService } from '../player';
import { BattleResult } from './battle.types';

export class BattleService {
  constructor(
    private readonly players: PlayerService,
    private readonly combat: CombatService,
    private readonly config: Pick<GameConfig, 'pvpEnergyCost' | 'stealRate'>,
  ) {}

  fight(attackerId: string, defenderId: string, action: CombatAction): BattleResult {
    if (attackerId === defenderId) throw new Error('A player cannot fight themselves.');
    const attacker = this.players.get(attackerId);
    const defender = this.players.get(defenderId);
    const energySpent = this.config.pvpEnergyCost;
    this.players.spendEnergy(attackerId, energySpent);

    const combat = this.combat.resolve(action, attacker, defender);
    const cashTransferred = combat.success
      ? Math.round(defender.cash * this.config.stealRate * 100) / 100
      : 0;

    if (cashTransferred > 0) {
      this.players.spendCash(defenderId, cashTransferred);
      this.players.addCash(attackerId, cashTransferred);
    }

    return {
      ...combat,
      attackerId,
      defenderId,
      energySpent,
      cashTransferred,
      attackerCash: this.players.get(attackerId).cash,
      defenderCash: this.players.get(defenderId).cash,
    };
  }
}
