import { CashTransactionType } from '@prisma/client';
import { PrismaService } from './prisma.service';

export interface PersistentAllyInput {
  id?: string;
  name: string;
  tier: string;
  power: number;
  smartness: number;
  hireCost: number;
}

export class DatabaseAlliesService {
  constructor(private readonly prisma: PrismaService) {}

  async createAlly(input: PersistentAllyInput) {
    if (!input.name.trim()) throw new Error('ally name is required.');
    if (!input.tier.trim()) throw new Error('ally tier is required.');
    if (!Number.isInteger(input.power) || input.power < 0) throw new Error('power must be a non-negative integer.');
    if (!Number.isInteger(input.smartness) || input.smartness < 0) throw new Error('smartness must be a non-negative integer.');
    if (input.power === 0 && input.smartness === 0) throw new Error('ally must provide a stat bonus.');
    if (!Number.isFinite(input.hireCost) || input.hireCost <= 0) throw new Error('hireCost must be positive.');
    return this.prisma.ally.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        name: input.name.trim(),
        tier: input.tier.trim(),
        power: input.power,
        smartness: input.smartness,
        hireCost: input.hireCost,
      },
    });
  }

  listAllies() {
    return this.prisma.ally.findMany({ orderBy: [{ tier: 'asc' }, { name: 'asc' }] });
  }

  async hire(playerId: string, allyId: string, towerRoomId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [player, ally, room] = await Promise.all([
        tx.player.findUnique({ where: { id: playerId } }),
        tx.ally.findUnique({ where: { id: allyId } }),
        tx.towerRoom.findUnique({ where: { id: towerRoomId } }),
      ]);
      if (!player) throw new Error('Player not found.');
      if (!ally) throw new Error('Ally not found.');
      if (!room || room.playerId !== playerId || !room.unlocked) throw new Error('Unlocked tower room not found.');

      const occupied = await tx.roomOccupant.findUnique({ where: { towerRoomId } });
      if (occupied) throw new Error('Tower room is already occupied.');
      const nextCash = Number(player.cash) - Number(ally.hireCost);
      if (nextCash < 0) throw new Error('Insufficient cash.');

      const occupant = await tx.roomOccupant.create({ data: { towerRoomId, allyId } });
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          cash: nextCash,
          power: { increment: ally.power },
          smartness: { increment: ally.smartness },
        },
      });
      await tx.cashTransaction.create({
        data: {
          playerId,
          type: CashTransactionType.ALLY_HIRE,
          amount: -Number(ally.hireCost),
          balanceAfter: nextCash,
          reference: occupant.id,
        },
      });
      return { occupant, player: updatedPlayer, ally };
    });
  }
}
