import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EnergyService } from '../energy/energy.service';
import { RuleService } from '../rule/rule.service';
import { StatService } from '../stat/stat.service';
import { WalletService } from '../wallet/wallet.service';
import { BattleLog, BattleLogInput, BattleResult, COMBAT_DEFAULTS, GenerateBattleResultInput } from './combat.types';

@Injectable()
export class CombatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly statService: StatService,
    private readonly ruleService: RuleService,
    private readonly energyService: EnergyService,
  ) {}

  async attack(attackerId: string, defenderId: string): Promise<BattleResult> {
    this.assertDifferentPlayers(attackerId, defenderId);
    const attackType = COMBAT_DEFAULTS.attackType;

    const ruleResult = await this.ruleService.canAttack(attackerId, defenderId);
    if (!ruleResult.allowed) {
      throw new BadRequestException(`Cannot attack: ${ruleResult.reason}`);
    }

    const [winProbability, cashReward] = await Promise.all([
      this.calculateWinProbability(attackerId, defenderId),
      this.calculateCashReward(attackerId, defenderId),
    ]);

    const result = await this.generateBattleResult({ attackerId, defenderId, attackType, winProbability, cashReward });
    await this.energyService.consume(attackerId, COMBAT_DEFAULTS.energyCost);
    if (result.success && result.cashStolen > 0) {
      await this.walletService.transfer(defenderId, attackerId, result.cashStolen, 'COMBAT_STEAL', result.battleId);
    }
    return result;
  }

  async calculateWinProbability(attackerId: string, defenderId: string): Promise<number> {
    this.assertDifferentPlayers(attackerId, defenderId);
    const [attackerStats, defenderStats] = await Promise.all([
      this.statService.calculate(attackerId),
      this.statService.calculate(defenderId),
    ]);
    const attackerPower = this.calculatePower(attackerStats.power, attackerStats.smartness, 0);
    const defenderPower = this.calculatePower(defenderStats.power, defenderStats.smartness, 0);
    const rawProbability = attackerPower / (attackerPower + defenderPower);
    return this.roundProbability(this.clamp(rawProbability, COMBAT_DEFAULTS.minWinProbability, COMBAT_DEFAULTS.maxWinProbability));
  }

  async calculateCashReward(_attackerId: string, defenderId: string): Promise<number> {
    const balance = await this.walletService.getBalance(defenderId);
    const currentCash = Math.max(0, balance.cash);
    const maximumSteal = Math.floor(currentCash * COMBAT_DEFAULTS.maxStealRate);
    return Math.max(0, Math.floor(maximumSteal * COMBAT_DEFAULTS.performanceMultiplier));
  }

  async createBattleLog(input: BattleLogInput): Promise<BattleLog> {
    const battle = await this.prisma.battle.create({
      data: {
        attackerId: input.attackerId,
        defenderId: input.defenderId,
        action: input.attackType,
        success: input.success,
        cashStolen: input.cashStolen,
        probability: input.probability,
        metadata: input.metadata ? JSON.stringify(input.metadata) : "{}",
      },
    });
    return {
      id: battle.id,
      attackerId: battle.attackerId,
      defenderId: battle.defenderId,
      attackType: battle.action,
      success: battle.success,
      cashStolen: battle.cashStolen,
      probability: battle.probability,
      metadata: (battle.metadata as Record<string, unknown>) ?? {},
      createdAt: battle.createdAt,
    };
  }

  async generateBattleResult(input: GenerateBattleResultInput): Promise<BattleResult> {
    this.assertDifferentPlayers(input.attackerId, input.defenderId);
    const attackType = input.attackType ?? COMBAT_DEFAULTS.attackType;
    const roll = input.randomRoll ?? Math.random();
    const success = roll < input.winProbability;
    const cashStolen = success ? Math.max(0, input.cashReward) : 0;
    const log = await this.createBattleLog({
      attackerId: input.attackerId,
      defenderId: input.defenderId,
      attackType,
      success,
      cashStolen,
      probability: input.winProbability,
      metadata: { roll },
    });
    return {
      battleId: log.id,
      attackerId: input.attackerId,
      defenderId: input.defenderId,
      attackType,
      winnerId: success ? input.attackerId : input.defenderId,
      loserId: success ? input.defenderId : input.attackerId,
      success,
      winProbability: input.winProbability,
      cashStolen,
      energySpent: COMBAT_DEFAULTS.energyCost,
      createdAt: log.createdAt,
    };
  }

  private calculatePower(primary: number, speed = 0, luck = 0): number {
    return Math.max(1, primary + speed * 0.25 + luck * 0.1);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private roundProbability(value: number): number {
    return Math.round(value * 10_000) / 10_000;
  }

  private assertDifferentPlayers(attackerId: string, defenderId: string): void {
    if (!attackerId || !defenderId) throw new BadRequestException('attackerId and defenderId are required');
    if (attackerId === defenderId) throw new BadRequestException('Players cannot attack themselves');
  }
}
