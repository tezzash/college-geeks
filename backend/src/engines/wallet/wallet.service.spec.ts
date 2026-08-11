import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  const playerFindUnique = jest.fn();
  const playerUpdate = jest.fn();
  const playerUpdateMany = jest.fn();
  const cashTransactionCreate = jest.fn();
  const tx = {
    player: { findUnique: playerFindUnique, update: playerUpdate, updateMany: playerUpdateMany },
    cashTransaction: { create: cashTransactionCreate },
  };
  const prisma = {
    player: { findUnique: playerFindUnique },
    $transaction: jest.fn((handler: (client: typeof tx) => Promise<unknown>) => handler(tx)),
  };
  let service: WalletService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletService(prisma as never);
  });

  it('returns a player balance', async () => {
    playerFindUnique.mockResolvedValueOnce({ id: 'player-1', cash: 100 });

    await expect(service.getBalance('player-1')).resolves.toEqual({ playerId: 'player-1', cash: 100 });
  });

  it('throws when a player balance cannot be found', async () => {
    playerFindUnique.mockResolvedValueOnce(null);

    await expect(service.getBalance('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('checks affordability from the current balance', async () => {
    playerFindUnique.mockResolvedValueOnce({ id: 'player-1', cash: 100 });

    await expect(service.canAfford('player-1', 75)).resolves.toBe(true);
  });

  it('deposits cash and records the transaction atomically', async () => {
    playerFindUnique.mockResolvedValueOnce({ id: 'player-1', cash: 100 });
    playerUpdate.mockResolvedValueOnce({ id: 'player-1', cash: 150 });
    cashTransactionCreate.mockResolvedValueOnce({ id: 'tx-1', playerId: 'player-1', amount: 50 });

    await expect(service.deposit('player-1', 50, 'job_reward', 'job-1')).resolves.toEqual({
      playerId: 'player-1',
      cash: 150,
      transactionId: 'tx-1',
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(playerUpdate).toHaveBeenCalledWith({
      where: { id: 'player-1' },
      data: { cash: { increment: 50 } },
      select: { id: true, cash: true },
    });
    expect(cashTransactionCreate).toHaveBeenCalledWith({
      data: { playerId: 'player-1', type: 'job_reward', amount: 50, reference: 'job-1' },
      select: { id: true, playerId: true, amount: true },
    });
  });

  it('withdraws cash and records a negative transaction amount atomically', async () => {
    playerUpdateMany.mockResolvedValueOnce({ count: 1 });
    playerFindUnique.mockResolvedValueOnce({ id: 'player-1', cash: 60 });
    cashTransactionCreate.mockResolvedValueOnce({ id: 'tx-2', playerId: 'player-1', amount: -40 });

    await expect(service.withdraw('player-1', 40, 'tower_room_unlock')).resolves.toEqual({
      playerId: 'player-1',
      cash: 60,
      transactionId: 'tx-2',
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(playerUpdateMany).toHaveBeenCalledWith({
      where: { id: 'player-1', cash: { gte: 40 } },
      data: { cash: { decrement: 40 } },
    });
    expect(cashTransactionCreate).toHaveBeenCalledWith({
      data: { playerId: 'player-1', type: 'tower_room_unlock', amount: -40, reference: null },
      select: { id: true, playerId: true, amount: true },
    });
  });

  it('prevents withdrawals that would create a negative balance', async () => {
    playerUpdateMany.mockResolvedValueOnce({ count: 0 });
    playerFindUnique.mockResolvedValueOnce({ id: 'player-1', cash: 20 });

    await expect(service.withdraw('player-1', 40, 'tower_room_unlock')).rejects.toBeInstanceOf(BadRequestException);
    expect(playerUpdate).not.toHaveBeenCalled();
    expect(playerUpdateMany).toHaveBeenCalledTimes(1);
    expect(cashTransactionCreate).not.toHaveBeenCalled();
  });

  it('transfers cash between two players in one transaction', async () => {
    playerFindUnique
      .mockResolvedValueOnce({ id: 'to', cash: 10 })
      .mockResolvedValueOnce({ id: 'from', cash: 75 });
    playerUpdateMany.mockResolvedValueOnce({ count: 1 });
    playerUpdate.mockResolvedValueOnce({ id: 'to', cash: 35 });
    cashTransactionCreate
      .mockResolvedValueOnce({ id: 'debit', playerId: 'from', amount: -25 })
      .mockResolvedValueOnce({ id: 'credit', playerId: 'to', amount: 25 });

    await expect(service.transfer('from', 'to', 25, 'pvp_reward', 'battle-1')).resolves.toEqual({
      from: { playerId: 'from', cash: 75, transactionId: 'debit' },
      to: { playerId: 'to', cash: 35, transactionId: 'credit' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(cashTransactionCreate).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid transfer requests', async () => {
    await expect(service.transfer('same', 'same', 10, 'transfer')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.deposit('player-1', 0, 'job_reward')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.deposit('player-1', 10, '')).rejects.toBeInstanceOf(BadRequestException);
  });
});
