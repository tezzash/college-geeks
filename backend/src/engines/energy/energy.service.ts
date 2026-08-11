import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Player } from '@prisma/client';
import { ConfigService } from '../config/config-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface EnergyState {
  playerId: string;
  current: number;
  max: number;
  lastEnergyUpdate: Date;
}

@Injectable()
export class EnergyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getCurrent(playerId: string): Promise<EnergyState> {
    this.assertPlayerId(playerId);
    return this.regenerate(playerId);
  }

  async regenerate(playerId: string): Promise<EnergyState> {
    this.assertPlayerId(playerId);

    return this.prisma.$transaction(async (tx) => {
      const player = await this.findPlayerOrThrow(tx, playerId);
      const maxEnergy = await this.configService.getNumber('player.energy.max');
      const regenerated = await this.calculateRegeneratedEnergy(player, maxEnergy, new Date());

      if (regenerated.energy === player.energy && regenerated.lastEnergyUpdate.getTime() === player.lastEnergyUpdate.getTime()) {
        return this.toEnergyState(player.id, regenerated.energy, maxEnergy, regenerated.lastEnergyUpdate);
      }

      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          energy: regenerated.energy,
          lastEnergyUpdate: regenerated.lastEnergyUpdate,
        },
      });

      return this.toEnergyState(updatedPlayer.id, updatedPlayer.energy, maxEnergy, updatedPlayer.lastEnergyUpdate);
    });
  }

  async consume(playerId: string, amount: number): Promise<EnergyState> {
    this.assertPlayerId(playerId);
    this.assertPositiveAmount(amount);

    return this.prisma.$transaction(async (tx) => {
      const player = await this.findPlayerOrThrow(tx, playerId);
      const maxEnergy = await this.configService.getNumber('player.energy.max');
      const regenerated = await this.calculateRegeneratedEnergy(player, maxEnergy, new Date());

      if (regenerated.energy < amount) {
        throw new BadRequestException('Not enough energy.');
      }

      const updatedEnergy = regenerated.energy - amount;
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          energy: updatedEnergy,
          lastEnergyUpdate: regenerated.lastEnergyUpdate,
        },
      });

      return this.toEnergyState(updatedPlayer.id, updatedPlayer.energy, maxEnergy, updatedPlayer.lastEnergyUpdate);
    });
  }

  async hasEnough(playerId: string, amount: number): Promise<boolean> {
    this.assertPlayerId(playerId);
    this.assertPositiveAmount(amount);

    const energy = await this.regenerate(playerId);
    return energy.current >= amount;
  }

  async getRemainingRegenTime(playerId: string): Promise<number> {
    this.assertPlayerId(playerId);

    const energy = await this.regenerate(playerId);
    if (energy.current >= energy.max) {
      return 0;
    }

    const intervalSeconds = await this.configService.getNumber('player.energy.regen_seconds');
    const elapsedSeconds = Math.floor((Date.now() - energy.lastEnergyUpdate.getTime()) / 1000);
    const remaining = intervalSeconds - (elapsedSeconds % intervalSeconds);
    return Math.max(0, remaining);
  }

  private async calculateRegeneratedEnergy(player: Player, maxEnergy: number, now: Date): Promise<Pick<Player, 'energy' | 'lastEnergyUpdate'>> {
    const boundedEnergy = Math.min(Math.max(player.energy, 0), maxEnergy);

    if (boundedEnergy >= maxEnergy) {
      return { energy: maxEnergy, lastEnergyUpdate: now };
    }

    const intervalSeconds = await this.configService.getNumber('player.energy.regen_seconds');
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - player.lastEnergyUpdate.getTime()) / 1000));
    const gainedEnergy = Math.floor(elapsedSeconds / intervalSeconds);

    if (gainedEnergy <= 0) {
      return { energy: boundedEnergy, lastEnergyUpdate: player.lastEnergyUpdate };
    }

    const energy = Math.min(maxEnergy, boundedEnergy + gainedEnergy);
    const lastEnergyUpdate = energy >= maxEnergy
      ? now
      : new Date(player.lastEnergyUpdate.getTime() + gainedEnergy * intervalSeconds * 1000);

    return { energy, lastEnergyUpdate };
  }

  private async findPlayerOrThrow(tx: Prisma.TransactionClient, playerId: string): Promise<Player> {
    const player = await tx.player.findUnique({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException('Player not found.');
    }
    return player;
  }

  private assertPlayerId(playerId: string): void {
    if (!playerId || playerId.trim().length === 0) {
      throw new BadRequestException('playerId is required.');
    }
  }

  private assertPositiveAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive integer.');
    }
  }

  private toEnergyState(playerId: string, current: number, max: number, lastEnergyUpdate: Date): EnergyState {
    return { playerId, current, max, lastEnergyUpdate };
  }
}
