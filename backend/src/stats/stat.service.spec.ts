import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { StatService } from './stat.service';
import { StatModifierSource } from './stat.types';

describe('StatService', () => {
  const playerId = 'player-1';
  let service: StatService;
  let prisma: {
    player: { findUnique: jest.Mock };
    towerRoom: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      player: { findUnique: jest.fn() },
      towerRoom: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StatService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(StatService);
  });

  it('calculates total power and smartness from hired allies in unlocked player rooms', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany.mockResolvedValue([
      {
        roomOccupants: [
          { ally: { basePower: 10, baseSmartness: 4 } },
          { ally: { basePower: 3, baseSmartness: 8 } },
        ],
      },
      {
        roomOccupants: [{ ally: { basePower: 7, baseSmartness: 1 } }],
      },
    ]);

    await expect(service.calculate(playerId)).resolves.toEqual({ power: 20, smartness: 13 });
    expect(prisma.towerRoom.findMany).toHaveBeenCalledWith({
      where: { playerId, unlocked: true },
      include: { roomOccupants: { include: { ally: true } } },
    });
  });

  it('calculates on demand and never stores totals', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany
      .mockResolvedValueOnce([{ roomOccupants: [{ ally: { basePower: 2, baseSmartness: 5 } }] }])
      .mockResolvedValueOnce([{ roomOccupants: [{ ally: { basePower: 9, baseSmartness: 11 } }] }]);

    await expect(service.calculate(playerId)).resolves.toEqual({ power: 2, smartness: 5 });
    await expect(service.calculate(playerId)).resolves.toEqual({ power: 9, smartness: 11 });
    expect(prisma.towerRoom.findMany).toHaveBeenCalledTimes(2);
    expect((prisma as any).player.update).toBeUndefined();
  });

  it('returns zero totals when the player has no hired allies', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany.mockResolvedValue([{ roomOccupants: [] }, {}]);

    await expect(service.calculate(playerId)).resolves.toEqual({ power: 0, smartness: 0 });
  });

  it('ignores occupant records that do not resolve to an ally', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany.mockResolvedValue([
      { roomOccupants: [{ ally: null }, { ally: { basePower: 6, baseSmartness: 2 } }] },
    ]);

    await expect(service.calculate(playerId)).resolves.toEqual({ power: 6, smartness: 2 });
  });

  it('supports current schema stat names as a fallback while preferring future base stat names', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany.mockResolvedValue([
      { roomOccupants: [{ ally: { power: 5, smartness: 12 } }] },
      { roomOccupants: [{ ally: { basePower: 4, power: 99, baseSmartness: 3, smartness: 99 } }] },
    ]);

    await expect(service.calculate(playerId)).resolves.toEqual({ power: 9, smartness: 15 });
  });

  it('throws a validation error when playerId is blank', async () => {
    await expect(service.calculate('   ')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.player.findUnique).not.toHaveBeenCalled();
    expect(prisma.towerRoom.findMany).not.toHaveBeenCalled();
  });

  it('throws a business rule error when the player does not exist', async () => {
    prisma.player.findUnique.mockResolvedValue(null);

    await expect(service.calculate(playerId)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.towerRoom.findMany).not.toHaveBeenCalled();
  });

  it('getPower returns only the calculated power', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany.mockResolvedValue([
      { roomOccupants: [{ ally: { basePower: 12, baseSmartness: 2 } }] },
    ]);

    await expect(service.getPower(playerId)).resolves.toBe(12);
  });

  it('getSmartness returns only the calculated smartness', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany.mockResolvedValue([
      { roomOccupants: [{ ally: { basePower: 12, baseSmartness: 2 } }] },
    ]);

    await expect(service.getSmartness(playerId)).resolves.toBe(2);
  });

  it('applies injected modifier sources without changing the public API', async () => {
    const modifierSource: StatModifierSource = {
      getContribution: jest.fn().mockResolvedValue({ power: 3, smartness: 4 }),
    };
    service = new StatService(prisma as any, [modifierSource]);
    prisma.player.findUnique.mockResolvedValue({ id: playerId });
    prisma.towerRoom.findMany.mockResolvedValue([
      { roomOccupants: [{ ally: { basePower: 12, baseSmartness: 2 } }] },
    ]);

    await expect(service.calculate(playerId)).resolves.toEqual({ power: 15, smartness: 6 });
    expect(modifierSource.getContribution).toHaveBeenCalledWith(playerId);
  });
});
