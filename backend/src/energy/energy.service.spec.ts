import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../database/prisma.service';

type PlayerRecord = {
  id: string;
  energy: number;
  lastEnergyUpdate: Date;
  username: string;
  email: string;
  passwordHash: string;
  cash: number;
  createdAt: Date;
  updatedAt: Date;
};

describe('EnergyService', () => {
  const playerId = 'player-1';
  let player: PlayerRecord | null;
  let tx: { player: { findUnique: jest.Mock; update: jest.Mock } };
  let prisma: Pick<PrismaService, '$transaction'>;
  let configService: Pick<ConfigService, 'getMaxEnergy' | 'getEnergyRegenIntervalSeconds'>;
  let service: EnergyService;

  const makePlayer = (overrides: Partial<PlayerRecord> = {}): PlayerRecord => ({
    id: playerId,
    username: 'tezza',
    email: 'tezza@example.com',
    passwordHash: 'hash',
    cash: 1000,
    energy: 5,
    lastEnergyUpdate: new Date('2026-08-01T00:00:00.000Z'),
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01T00:14:00.000Z'));
    player = makePlayer();
    tx = {
      player: {
        findUnique: jest.fn(async () => player),
        update: jest.fn(async ({ data }) => {
          if (!player) throw new Error('Unexpected update without player');
          player = { ...player, ...data, updatedAt: new Date() };
          return player;
        }),
      },
    };
    prisma = {
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    };
    configService = {
      getMaxEnergy: jest.fn(() => 10),
      getEnergyRegenIntervalSeconds: jest.fn(() => 420),
    };
    service = new EnergyService(prisma as PrismaService, configService as ConfigService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCurrent', () => {
    it('returns lazily regenerated energy for a player', async () => {
      const result = await service.getCurrent(playerId);

      expect(result.current).toBe(7);
      expect(result.max).toBe(10);
      expect(tx.player.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: { energy: 7, lastEnergyUpdate: new Date('2026-08-01T00:14:00.000Z') },
      });
    });

    it('rejects a blank player id', async () => {
      await expect(service.getCurrent('  ')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('regenerate', () => {
    it('does not exceed configured maximum energy', async () => {
      player = makePlayer({ energy: 9, lastEnergyUpdate: new Date('2026-07-31T23:00:00.000Z') });

      const result = await service.regenerate(playerId);

      expect(result.current).toBe(10);
      expect(result.max).toBe(10);
    });

    it('does not update when no interval has elapsed', async () => {
      player = makePlayer({ energy: 3, lastEnergyUpdate: new Date('2026-08-01T00:10:00.000Z') });

      const result = await service.regenerate(playerId);

      expect(result.current).toBe(3);
      expect(tx.player.update).not.toHaveBeenCalled();
    });

    it('bounds stored negative energy at zero', async () => {
      player = makePlayer({ energy: -3, lastEnergyUpdate: new Date('2026-08-01T00:14:00.000Z') });

      const result = await service.regenerate(playerId);

      expect(result.current).toBe(0);
      expect(tx.player.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: { energy: 0, lastEnergyUpdate: new Date('2026-08-01T00:14:00.000Z') },
      });
    });

    it('throws when the player is missing', async () => {
      player = null;

      await expect(service.regenerate(playerId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('consume', () => {
    it('regenerates first and consumes energy atomically', async () => {
      const result = await service.consume(playerId, 4);

      expect(result.current).toBe(3);
      expect(tx.player.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: { energy: 3, lastEnergyUpdate: new Date('2026-08-01T00:14:00.000Z') },
      });
    });

    it('prevents energy from going below zero', async () => {
      await expect(service.consume(playerId, 8)).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.player.update).not.toHaveBeenCalled();
    });

    it.each([0, -1, 1.5, Number.NaN])('rejects invalid amount %s', async (amount) => {
      await expect(service.consume(playerId, amount)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('hasEnough', () => {
    it('returns true when regenerated energy covers the amount', async () => {
      await expect(service.hasEnough(playerId, 7)).resolves.toBe(true);
    });

    it('returns false when regenerated energy is too low', async () => {
      await expect(service.hasEnough(playerId, 8)).resolves.toBe(false);
    });

    it('rejects invalid amounts', async () => {
      await expect(service.hasEnough(playerId, 0)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getRemainingRegenTime', () => {
    it('returns zero when energy is full', async () => {
      player = makePlayer({ energy: 10 });

      await expect(service.getRemainingRegenTime(playerId)).resolves.toBe(0);
    });

    it('returns seconds until the next lazy regeneration interval', async () => {
      player = makePlayer({ energy: 4, lastEnergyUpdate: new Date('2026-08-01T00:11:00.000Z') });

      await expect(service.getRemainingRegenTime(playerId)).resolves.toBe(240);
    });
  });
});
