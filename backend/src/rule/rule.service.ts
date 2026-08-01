import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { EnergyService } from '../energy/energy.service';
import { PrismaService } from '../database/prisma.service';
import { StatService } from '../stats/stat.service';
import { WalletService } from '../wallet/wallet.service';
import { RuleFailureReason, RuleValidationResult } from './rule.types';

type PrismaDelegate = { findUnique?: (args: unknown) => Promise<unknown>; findFirst?: (args: unknown) => Promise<unknown>; count?: (args: unknown) => Promise<number> };
type RulePrisma = PrismaService & Record<string, PrismaDelegate | undefined>;

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
    const config = this.configService.getGameplayConfig();
    if (!config.pvp.enabled) return this.deny('PVP_DISABLED');
    if (!(await this.exists('player', attackerId))) return this.deny('PLAYER_NOT_FOUND');
    if (!(await this.exists('player', defenderId))) return this.deny('TARGET_NOT_FOUND');
    const energy = await this.energyService.getEnergy(attackerId);
    if (energy < config.pvp.energyCost) return this.deny('NOT_ENOUGH_ENERGY', { required: config.pvp.energyCost, available: energy });
    await this.statService.getPlayerStats(attackerId);
    await this.statService.getPlayerStats(defenderId);
    return this.allow({ energyCost: config.pvp.energyCost });
  }

  async canHireAlly(playerId: string, allyId: string): Promise<RuleValidationResult> {
    const ids = this.validateIds(playerId, allyId);
    if (!ids.allowed) return ids;
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const ally = await this.findUnique<Record<string, unknown>>('ally', allyId);
    if (!ally) return this.deny('ALLY_NOT_FOUND');
    const existing = await this.delegate('roomOccupant')?.findFirst?.({ where: { allyId, towerRoom: { playerId } } });
    if (existing) return this.deny('ALLY_ALREADY_HIRED');
    const hireCost = this.numberFrom(ally.hireCost ?? ally.hire_cost);
    return this.canSpendCash(playerId, hireCost);
  }

  async canUnlockRoom(playerId: string, roomNumber: number): Promise<RuleValidationResult> {
    if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID');
    if (!Number.isInteger(roomNumber) || roomNumber <= 0) return this.deny('ROOM_NOT_FOUND');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const config = this.configService.getGameplayConfig();
    if (config.tower.maxRooms > 0 && roomNumber > config.tower.maxRooms) return this.deny('ROOM_LIMIT_REACHED');
    const room = await this.delegate('towerRoom')?.findFirst?.({ where: { playerId, roomNumber } }) as Record<string, unknown> | undefined;
    if (room?.unlocked) return this.deny('ROOM_ALREADY_UNLOCKED');
    const cost = this.numberFrom(room?.unlockCost ?? room?.unlock_cost ?? config.tower.roomUnlockCosts[roomNumber]);
    return this.canSpendCash(playerId, cost);
  }

  async canStartJob(playerId: string, jobId: string): Promise<RuleValidationResult> {
    const ids = this.validateIds(playerId, jobId);
    if (!ids.allowed) return ids;
    const config = this.configService.getGameplayConfig();
    if (!config.jobs.enabled) return this.deny('JOBS_DISABLED');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    if (!(await this.exists('job', jobId))) return this.deny('JOB_NOT_FOUND');
    const active = await this.getActiveJob(playerId);
    if (active) return this.deny('ACTIVE_JOB_EXISTS');
    const energy = await this.energyService.getEnergy(playerId);
    if (energy < config.jobs.energyCost) return this.deny('NOT_ENOUGH_ENERGY', { required: config.jobs.energyCost, available: energy });
    return this.allow({ energyCost: config.jobs.energyCost });
  }

  async canCollectJob(playerId: string): Promise<RuleValidationResult> {
    if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const active = await this.getActiveJob(playerId) as Record<string, unknown> | undefined;
    if (!active) return this.deny('NO_ACTIVE_JOB');
    if (active.collected) return this.deny('JOB_ALREADY_COLLECTED');
    const finishesAt = active.finishesAt ?? active.finishes_at;
    if (finishesAt && new Date(finishesAt as string | Date).getTime() > Date.now()) return this.deny('JOB_NOT_READY', { finishesAt });
    return this.allow({ activeJobId: active.id });
  }

  async canSpendCash(playerId: string, amount: number): Promise<RuleValidationResult> {
    if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID');
    if (!Number.isFinite(amount) || amount < 0) return this.deny('INVALID_AMOUNT');
    if (!(await this.exists('player', playerId))) return this.deny('PLAYER_NOT_FOUND');
    const balance = await this.walletService.getBalance(playerId);
    if (balance < amount) return this.deny('NOT_ENOUGH_CASH', { required: amount, available: balance });
    return this.allow({ required: amount, available: balance });
  }

  private async getActiveJob(playerId: string): Promise<unknown> { return this.delegate('activeJob')?.findFirst?.({ where: { playerId, collected: false } }); }
  private validateIds(playerId: string, targetId: string): RuleValidationResult { if (!this.validId(playerId)) return this.deny('INVALID_PLAYER_ID'); if (!this.validId(targetId)) return this.deny('INVALID_TARGET_ID'); return this.allow(); }
  private validId(value: string): boolean { return typeof value === 'string' && value.trim().length > 0; }
  private async exists(model: string, id: string): Promise<boolean> { return Boolean(await this.findUnique(model, id)); }
  private async findUnique<T>(model: string, id: string): Promise<T | undefined> { return await this.delegate(model)?.findUnique?.({ where: { id } }) as T | undefined; }
  private delegate(model: string): PrismaDelegate | undefined { return (this.prisma as RulePrisma)[model]; }
  private numberFrom(value: unknown): number { return typeof value === 'number' ? value : 0; }
  private allow<TMeta extends Record<string, unknown> = Record<string, unknown>>(meta?: TMeta): RuleValidationResult<TMeta> { return { allowed: true, ...(meta ? { meta } : {}) }; }
  private deny<TMeta extends Record<string, unknown> = Record<string, unknown>>(reason: RuleFailureReason, meta?: TMeta): RuleValidationResult<TMeta> { return { allowed: false, reason, ...(meta ? { meta } : {}) }; }
}
