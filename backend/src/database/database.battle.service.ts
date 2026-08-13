import { BattleAction, CashTransactionType } from '@prisma/client';
import { CombatAction, CombatService } from '../combat';
import { PrismaService } from './prisma.service';

export class DatabaseBattleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly combat: CombatService,
    private readonly pvpEnergyCost: number,
    private readonly stealRate: number,
  ) {}

  async fight(attackerId: string, defenderId: string, action: CombatAction) {
    if (attackerId === defenderId) throw new Error('A player cannot fight themselves.');
    if (!Number.isInteger(this.pvpEnergyCost) || this.pvpEnergyCost <= 0) throw new Error('Invalid PvP energy cost.');
    if (!Number.isFinite(this.stealRate) || this.stealRate < 0 || this.stealRate > 1) throw new Error('Invalid steal rate.');

    return this.prisma.$transaction(async (tx) => {
      const reserved = await tx.player.updateMany({
        where: { id: attackerId, energy: { gte: this.pvpEnergyCost } },
        data: { energy: { decrement: this.pvpEnergyCost } },
      });
      if (reserved.count !== 1) throw new Error('Insufficient energy.');

      const [attacker, defender] = await Promise.all([
        tx.player.findUnique({ where: { id: attackerId } }),
        tx.player.findUnique({ where: { id: defenderId } }),
      ]);
      if (!attacker || !defender) throw new Error('Player not found.');

      const combat = this.combat.resolve(action, attacker, defender);
      const cashTransferred = combat.success
        ? Math.round(Number(defender.cash) * this.stealRate * 100) / 100
        : 0;

      if (cashTransferred > 0) {
        const debited = await tx.player.updateMany({
          where: { id: defenderId, cash: { gte: cashTransferred } },
          data: { cash: { decrement: cashTransferred } },
        });
        if (debited.count !== 1) throw new Error('Defender cash changed during battle. Please retry.');
        await tx.player.update({ where: { id: attackerId }, data: { cash: { increment: cashTransferred } } });

        const [attackerAfter, defenderAfter] = await Promise.all([
          tx.player.findUniqueOrThrow({ where: { id: attackerId } }),
          tx.player.findUniqueOrThrow({ where: { id: defenderId } }),
        ]);
        await tx.cashTransaction.createMany({
          data: [
            {
              playerId: attackerId,
              type: CashTransactionType.PVP_STEAL_CREDIT,
              amount: cashTransferred,
              balanceAfter: attackerAfter.cash,
              reference: defenderId,
            },
            {
              playerId: defenderId,
              type: CashTransactionType.PVP_STEAL_DEBIT,
              amount: -cashTransferred,
              balanceAfter: defenderAfter.cash,
              reference: attackerId,
            },
          ],
        });
      }

      const battle = await tx.battle.create({
        data: {
          attackerId,
          defenderId,
          action: action === 'punch' ? BattleAction.PUNCH : BattleAction.FACE_OFF,
          success: combat.success,
          cashStolen: cashTransferred,
        },
      });

      const [attackerAfter, defenderAfter] = await Promise.all([
        tx.player.findUniqueOrThrow({ where: { id: attackerId } }),
        tx.player.findUniqueOrThrow({ where: { id: defenderId } }),
      ]);

      return {
        battle,
        combat,
        attackerId,
        defenderId,
        energySpent: this.pvpEnergyCost,
        cashTransferred,
        attackerCash: Number(attackerAfter.cash),
        defenderCash: Number(defenderAfter.cash),
        attackerEnergy: attackerAfter.energy,
      };
    });
  }
}
