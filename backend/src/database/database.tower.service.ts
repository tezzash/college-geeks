import { CashTransactionType } from '@prisma/client';
import { PrismaService } from './prisma.service';

export interface PersistentTowerRoomInput {
  roomNumber: number;
  unlockCost: number;
}

export class DatabaseTowerService {
  constructor(private readonly prisma: PrismaService) {}

  async unlock(playerId: string, input: PersistentTowerRoomInput) {
    if (!Number.isInteger(input.roomNumber) || input.roomNumber <= 0) throw new Error('roomNumber must be a positive integer.');
    if (!Number.isFinite(input.unlockCost) || input.unlockCost <= 0) throw new Error('unlockCost must be positive.');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.towerRoom.findUnique({ where: { playerId_roomNumber: { playerId, roomNumber: input.roomNumber } } });
      if (existing?.unlocked) throw new Error('Tower room already unlocked.');

      const player = await tx.player.findUnique({ where: { id: playerId } });
      if (!player) throw new Error('Player not found.');
      const nextCash = Number(player.cash) - input.unlockCost;
      if (nextCash < 0) throw new Error('Insufficient cash.');

      const room = existing
        ? await tx.towerRoom.update({ where: { id: existing.id }, data: { unlockCost: input.unlockCost, unlocked: true } })
        : await tx.towerRoom.create({ data: { playerId, roomNumber: input.roomNumber, unlockCost: input.unlockCost, unlocked: true } });
      await tx.player.update({ where: { id: playerId }, data: { cash: nextCash } });
      await tx.cashTransaction.create({
        data: {
          playerId,
          type: CashTransactionType.TOWER_ROOM_UNLOCK,
          amount: -input.unlockCost,
          balanceAfter: nextCash,
          reference: room.id,
        },
      });
      return room;
    });
  }

  list(playerId: string) {
    return this.prisma.towerRoom.findMany({ where: { playerId }, orderBy: { roomNumber: 'asc' }, include: { occupants: { include: { ally: true } } } });
  }
}
