import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PrismaTransactionClient,
  WalletBalance,
  WalletTransactionResult,
  WalletTransferResult,
} from './wallet.types';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(playerId: string): Promise<WalletBalance> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, cash: true },
    });

    if (!player) {
      throw new NotFoundException(`Player ${playerId} was not found.`);
    }

    return { playerId: player.id, cash: player.cash };
  }

  async canAfford(playerId: string, amount: number): Promise<boolean> {
    this.assertPositiveAmount(amount);
    const balance = await this.getBalance(playerId);
    return balance.cash >= amount;
  }

  async deposit(
    playerId: string,
    amount: number,
    transactionType: string,
    referenceId?: string,
  ): Promise<WalletTransactionResult> {
    this.assertPositiveAmount(amount);
    this.assertTransactionType(transactionType);

    return this.prisma.$transaction(async (tx: PrismaTransactionClient) => {
      await this.assertPlayerExists(tx, playerId);

      const player = await tx.player.update({
        where: { id: playerId },
        data: { cash: { increment: amount } },
        select: { id: true, cash: true },
      });

      const transaction = await this.recordTransaction(tx, playerId, amount, transactionType, referenceId);

      return { playerId: player.id, cash: player.cash, transactionId: transaction.id };
    });
  }

  async withdraw(
    playerId: string,
    amount: number,
    transactionType: string,
    referenceId?: string,
  ): Promise<WalletTransactionResult> {
    this.assertPositiveAmount(amount);
    this.assertTransactionType(transactionType);

    return this.prisma.$transaction(async (tx: PrismaTransactionClient) => {
      await this.decrementIfAffordable(tx, playerId, amount);

      const updatedPlayer = await this.getPlayerForUpdateResult(tx, playerId);

      const transaction = await this.recordTransaction(tx, playerId, -amount, transactionType, referenceId);

      return { playerId: updatedPlayer.id, cash: updatedPlayer.cash, transactionId: transaction.id };
    });
  }

  async transfer(
    fromPlayerId: string,
    toPlayerId: string,
    amount: number,
    transactionType: string,
    referenceId?: string,
  ): Promise<WalletTransferResult> {
    this.assertPositiveAmount(amount);
    this.assertTransactionType(transactionType);

    if (fromPlayerId === toPlayerId) {
      throw new BadRequestException('Cannot transfer cash to the same player.');
    }

    return this.prisma.$transaction(async (tx: PrismaTransactionClient) => {
      await this.assertPlayerExists(tx, toPlayerId);
      await this.decrementIfAffordable(tx, fromPlayerId, amount);

      const updatedFromPlayer = await this.getPlayerForUpdateResult(tx, fromPlayerId);
      const debit = await this.recordTransaction(tx, fromPlayerId, -amount, transactionType, referenceId);

      const updatedToPlayer = await tx.player.update({
        where: { id: toPlayerId },
        data: { cash: { increment: amount } },
        select: { id: true, cash: true },
      });
      const credit = await this.recordTransaction(tx, toPlayerId, amount, transactionType, referenceId);

      return {
        from: { playerId: updatedFromPlayer.id, cash: updatedFromPlayer.cash, transactionId: debit.id },
        to: { playerId: updatedToPlayer.id, cash: updatedToPlayer.cash, transactionId: credit.id },
      };
    });
  }

  private async decrementIfAffordable(tx: PrismaTransactionClient, playerId: string, amount: number): Promise<void> {
    const result = await tx.player.updateMany({
      where: { id: playerId, cash: { gte: amount } },
      data: { cash: { decrement: amount } },
    });

    if (result.count === 1) {
      return;
    }

    await this.assertPlayerExists(tx, playerId);
    throw new BadRequestException('Insufficient funds.');
  }

  private async getPlayerForUpdateResult(
    tx: PrismaTransactionClient,
    playerId: string,
  ): Promise<{ id: string; cash: number }> {
    return this.assertPlayerExists(tx, playerId);
  }

  private async assertPlayerExists(tx: PrismaTransactionClient, playerId: string): Promise<{ id: string; cash: number }> {
    const player = await tx.player.findUnique({
      where: { id: playerId },
      select: { id: true, cash: true },
    });

    if (!player) {
      throw new NotFoundException(`Player ${playerId} was not found.`);
    }

    return player;
  }

  private async recordTransaction(
    tx: PrismaTransactionClient,
    playerId: string,
    amount: number,
    transactionType: string,
    referenceId?: string,
  ): Promise<{ id: string; playerId: string; amount: number }> {
    return tx.cashTransaction.create({
      data: {
        playerId,
        type: transactionType,
        amount,
        reference: referenceId ?? null,
      },
      select: { id: true, playerId: true, amount: true },
    });
  }

  private assertPositiveAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }
  }

  private assertTransactionType(transactionType: string): void {
    if (!transactionType?.trim()) {
      throw new BadRequestException('Transaction type is required.');
    }
  }
}
