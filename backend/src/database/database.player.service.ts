import { CashTransactionType } from '@prisma/client';
import { PrismaService } from './prisma.service';

export interface PersistentPlayerInput {
  id?: string;
  username: string;
  email: string;
  passwordHash: string;
  cash?: number;
  energy?: number;
  power?: number;
  smartness?: number;
}

export interface PersistentPlayerState {
  id: string;
  username: string;
  email: string;
  cash: number;
  energy: number;
  power: number;
  smartness: number;
}

export interface PlayerCredentials {
  player: PersistentPlayerState;
  passwordHash: string;
}

export class DatabasePlayerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: PersistentPlayerInput): Promise<PersistentPlayerState> {
    const cash = input.cash ?? 1000;
    const player = await this.prisma.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: {
          ...(input.id ? { id: input.id } : {}),
          username: input.username.trim(),
          email: input.email.trim().toLowerCase(),
          passwordHash: input.passwordHash,
          cash,
          energy: input.energy ?? 10,
          power: input.power ?? 0,
          smartness: input.smartness ?? 0,
        },
      });
      await tx.cashTransaction.create({ data: { playerId: created.id, type: CashTransactionType.STARTING_CASH, amount: cash, balanceAfter: cash, reference: 'player-create' } });
      return created;
    });
    return this.toState(player);
  }

  async findCredentials(login: string): Promise<PlayerCredentials | null> {
    const normalized = login.trim().toLowerCase();
    const player = await this.prisma.player.findFirst({ where: { OR: [{ username: login.trim() }, { email: normalized }] } });
    if (!player) return null;
    return { player: this.toState(player), passwordHash: player.passwordHash };
  }

  async search(query: string, excludeId: string): Promise<Array<Pick<PersistentPlayerState, 'id' | 'username' | 'power' | 'smartness'>>> {
    const normalized = query.trim();
    return this.prisma.player.findMany({
      where: { id: { not: excludeId }, ...(normalized ? { username: { contains: normalized, mode: 'insensitive' } } : {}) },
      select: { id: true, username: true, power: true, smartness: true },
      orderBy: { username: 'asc' },
      take: 20,
    });
  }

  async get(id: string): Promise<PersistentPlayerState> {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) throw new Error('Player not found.');
    return this.toState(player);
  }

  async addCash(id: string, amount: number, type: CashTransactionType, reference?: string): Promise<PersistentPlayerState> {
    this.validateAmount(amount);
    const player = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.player.update({ where: { id }, data: { cash: { increment: amount } } });
      await tx.cashTransaction.create({ data: { playerId: id, type, amount, balanceAfter: updated.cash, reference } });
      return updated;
    }, { isolationLevel: 'Serializable' });
    return this.toState(player);
  }

  async spendCash(id: string, amount: number, type: CashTransactionType, reference?: string): Promise<PersistentPlayerState> {
    this.validateAmount(amount);
    const player = await this.prisma.$transaction(async (tx) => {
      const charged = await tx.player.updateMany({ where: { id, cash: { gte: amount } }, data: { cash: { decrement: amount } } });
      if (charged.count !== 1) {
        const exists = await tx.player.findUnique({ where: { id }, select: { id: true } });
        if (!exists) throw new Error('Player not found.');
        throw new Error('Insufficient cash.');
      }
      const updated = await tx.player.findUniqueOrThrow({ where: { id } });
      await tx.cashTransaction.create({ data: { playerId: id, type, amount: -amount, balanceAfter: updated.cash, reference } });
      return updated;
    }, { isolationLevel: 'Serializable' });
    return this.toState(player);
  }

  async updateStats(id: string, powerDelta: number, smartnessDelta: number): Promise<PersistentPlayerState> {
    if (!Number.isInteger(powerDelta) || powerDelta < 0) throw new Error('powerDelta must be a non-negative integer.');
    if (!Number.isInteger(smartnessDelta) || smartnessDelta < 0) throw new Error('smartnessDelta must be a non-negative integer.');
    const player = await this.prisma.player.update({ where: { id }, data: { power: { increment: powerDelta }, smartness: { increment: smartnessDelta } } });
    return this.toState(player);
  }

  async setEnergy(id: string, energy: number): Promise<PersistentPlayerState> {
    if (!Number.isInteger(energy) || energy < 0) throw new Error('energy must be a non-negative integer.');
    const player = await this.prisma.player.update({ where: { id }, data: { energy } });
    return this.toState(player);
  }

  private validateAmount(amount: number): void { if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be positive.'); }
  private toState(player: { id: string; username: string; email: string; cash: unknown; energy: number; power: number; smartness: number }): PersistentPlayerState {
    return { id: player.id, username: player.username, email: player.email, cash: Number(player.cash), energy: player.energy, power: player.power, smartness: player.smartness };
  }
}
