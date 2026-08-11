import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config-engine.service';
import { EnergyService } from '../energy/energy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StatService } from '../stat/stat.service';
import { WalletService } from '../wallet/wallet.service';
import { RuleFailureReason, RuleValidationResult } from './rule.types';

@Injectable()
export class RuleService {
  constructor(
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly energyService: EnergyService,
    private readonly statService: StatService,
    private readonly prisma: PrismaService,
  ) {}

  async canAttack(attackerId: string, defenderId: string): Promise<RuleValidationResult> {
    const ids = this.validateIds(attackerId, defenderId);
    if (!ids.allowed) return ids;
    if (attackerId === defenderId) return this.deny('SELF_TARGET_NOT_ALLOWED');
    const pvpEnabled = await this.configService.getBoolean('gameplay.pvp.enabled');
    if (!pvpEnabled) return this.deny('PVP_DISABLED');
    if (!(await this.exists('player', attackerId))) return this.deny('PLAYER_NOT_FOUND');
    if (!(await this.exists('player', defenderId))) return this.deny('TARGET_NOT_FOUND');
    const energyState = await this.energyService.getCurrent(attackerId);
    const energyCost = await this.configService.getNumber('gameplay.pvp.energy_cost');
    if (energyState.current < energyCost) return this.deny('NOT_ENOUGH_ENERGY', { required: energyCost, available: energyState.current });
    await this.statService.calculate(attackerId);
    await this.statService.calculate(defenderId);
    return this.allow({ energyCost });
  }

  async canHireAlly(playerId: string, allyId: string): Promise<RuleValidationResult> {
    const ids = this.validateIds(playerId, allyId);
    if (!ids.allowed) return ids;
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const ally = await this.prisma.ally.findUnique({ where: { id: allyId } });
    if (!ally) return this.deny('ALLY_NOT_FOUND');
    const existing = await this.prisma.roomOccupant.findFirst({ where: { allyId, towerRoom: { playerId } } });
    if (existing) return this.deny('ALLY_ALREADY_HIRED');
    const hireCost = this.numberFrom(ally.hireCost);
    return this.canSpendCash(playerId, hireCost);
  }

  async canUnlockRoom(playerId: string, roomNumber: number): Promise<RuleValidationResult> {
    if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID');
    if (!Number.isInteger(roomNumber) || roomNumber <= 0) return this.deny('ROOM_NOT_FOUND');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const maxRooms = await this.configService.getNumber('gameplay.tower.max_rooms');
    if (maxRooms > 0 && roomNumber > maxRooms) return this.deny('ROOM_LIMIT_REACHED');
    const room = await this.prisma.towerRoom.findFirst({ where: { playerId, roomNumber } });
    if (room?.unlocked) return this.deny('ROOM_ALREADY_UNLOCKED');
    // Fallback to 0 if neither the DB nor the config specify a cost.
    const cost = this.numberFrom(room?.unlockCost ?? 0);
    return this.canSpendCash(playerId, cost);
  }

  async canStartJob(playerId: string, jobId: string): Promise<RuleValidationResult> {
    const ids = this.validateIds(playerId, jobId);
    if (!ids.allowed) return ids;
    const jobsEnabled = await this.configService.getBoolean('gameplay.jobs.enabled');
    if (!jobsEnabled) return this.deny('JOBS_DISABLED');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    if (!(await this.exists('job', jobId))) return this.deny('JOB_NOT_FOUND');
    const active = await this.getActiveJob(playerId);
    if (active) return this.deny('ACTIVE_JOB_EXISTS');
    const energyState = await this.energyService.getCurrent(playerId);
    const energyCost = await this.configService.getNumber('gameplay.jobs.energy_cost');
    if (energyState.current < energyCost) return this.deny('NOT_ENOUGH_ENERGY', { required: energyCost, available: energyState.current });
    return this.allow({ energyCost });
  }

  async canCollectJob(playerId: string): Promise<RuleValidationResult> {
    if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const active = await this.getActiveJob(playerId);
    if (!active) return this.deny('NO_ACTIVE_JOB');
    if (active.collected) return this.deny('JOB_ALREADY_COLLECTED');
    const finishesAt = active.finishesAt;
    if (finishesAt && new Date(finishesAt).getTime() > Date.now()) return this.deny('JOB_NOT_READY', { finishesAt });
    return this.allow({ activeJobId: active.id });
  }

  async canSpendCash(playerId: string, amount: number): Promise<RuleValidationResult> {
    if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID');
    if (!Number.isFinite(amount) || amount < 0) return this.deny('INVALID_AMOUNT');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const balanceInfo = await this.walletService.getBalance(playerId);
    if (balanceInfo.cash < amount) return this.deny('NOT_ENOUGH_CASH', { required: amount, available: balanceInfo.cash });
    return this.allow({ required: amount, available: balanceInfo.cash });
  }

  private async getActiveJob(playerId: string) { return this.prisma.activeJob.findFirst({ where: { playerId, collected: false } }); }
  private validateIds(playerId: string, targetId: string): RuleValidationResult { if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID'); if (!this.validId(targetId)) return this.deny('INVALID_TARGET_ID'); return this.allow(); }
  private validId(value: string): boolean { return typeof value === 'string' && value.trim().length > 0; }
  private async exists(model: 'player' | 'job', id: string): Promise<boolean> {
    if (model === 'player') {
      return Boolean(await this.prisma.player.findUnique({ where: { id } }));
    } else if (model === 'job') {
      return Boolean(await this.prisma.job.findUnique({ where: { id } }));
    }
    return false;
  }
  private numberFrom(value: unknown): number { return typeof value === 'number' ? value : 0; }
  private allow<TMeta extends Record<string, unknown> = Record<string, unknown>>(meta?: TMeta): RuleValidationResult<TMeta> { return { allowed: true, ...(meta ? { meta } : {}) }; }
  private deny<TMeta extends Record<string, unknown> = Record<string, unknown>>(reason: RuleFailureReason, meta?: TMeta): RuleValidationResult<TMeta> { return { allowed: false, reason, ...(meta ? { meta } : {}) }; }
}
