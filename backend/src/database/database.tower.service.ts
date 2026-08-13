import { CashTransactionType } from '@prisma/client';
import { PrismaService } from './prisma.service';

export const TOWER_UNLOCK_COSTS: Readonly<Record<number, number>> = Object.freeze({
  1: 250,
  2: 500,
  3: 900,
  4: 1500,
});

export interface PersistentTowerRoomInput {
  roomNumber: number;
}

export class DatabaseTowerService {
  constructor(private readonly prisma: PrismaService) {}

  async unlock(playerId: string, input: PersistentTowerRoomInput) {
    if (!Number.isInteger(input.roomNumber) || input.roomNumber <= 0) {
      throw new Error('roomNumber must be a positive integer.');
    }
    const unlockCost = TOWER_UNLOCK_COSTS[input.roomNumber];
    if (unlockCost === undefined) throw new Error('Tower room not found.');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.towerRoom.findUnique({
        where: { playerId_roomNumber: { playerId, roomNumber: input.roomNumber } },
      });
      if (existing?.unlocked) throw new Error('Tower room already unlocked.');

      const charged = await tx.player.updateMany({
        where: { id: playerId, cash: { gte: unlockCost } },
        data: { cash: { decrement: unlockCost } },
      });
      if (charged.count !== 1) {
        const player = await tx.player.findUnique({ where: { id: playerId }, select: { id: true } });
        if (!player) throw new Error('Player not found.');
        throw new Error('Insufficient cash.');
      }

      const room = existing
        ? await tx.towerRoom.update({ where: { id: existing.id }, data: { unlockCost, unlocked: true } })
        : await tx.towerRoom.create({ data: { playerId, roomNumber: input.roomNumber, unlockCost, unlocked: true } });
      const player = await tx.player.findUniqueOrThrow({ where: { id: playerId }, select: { cash: true } });

      await tx.cashTransaction.create({
        data: {
          playerId,
          type: CashTransactionType.TOWER_ROOM_UNLOCK,
          amount: -unlockCost,
          balanceAfter: player.cash,
          reference: room.id,
        },
      });
      return room;
    }, { isolationLevel: 'Serializable' });
  }

  list(playerId: string) {
    return this.prisma.towerRoom.findMany({
      where: { playerId },
      orderBy: { roomNumber: 'asc' },
      include: { occupants: { include: { ally: true } } },
    });
  }
}
