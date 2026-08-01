import { BadRequestException } from '@nestjs/common';
import { CombatService, DOMAIN_EVENT_BUS } from './combat.service';
import { COMBAT_DEFAULTS } from './combat.types';

describe('CombatService', () => {
  const createdAt = new Date('2026-08-01T00:00:00.000Z');
  let service: CombatService;
  let prisma: any;
  let walletService: any;
  let statService: any;
  let ruleService: any;
  let energyService: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {
      battle: {
        create: jest.fn(async ({ data }) => ({ id: 'battle-1', createdAt, ...data })),
      },
    };
    walletService = { getBalance: jest.fn(), transferCash: jest.fn() };
    statService = { getEffectiveStats: jest.fn() };
    ruleService = { validateCombatAttack: jest.fn() };
    energyService = { consumeEnergy: jest.fn() };
    eventBus = { emit: jest.fn() };
    service = new CombatService(prisma, walletService, statService, ruleService, energyService, eventBus);
  });

  it('uses dependency injection token for domain event bus', () => {
    expect(DOMAIN_EVENT_BUS).toBeDefined();
  });

  describe('attack', () => {
    it('executes a successful PvP attack through foundation engines', async () => {
      statService.getEffectiveStats.mockResolvedValueOnce({ attack: 90, speed: 10, luck: 5 }).mockResolvedValueOnce({ defense: 10 });
      walletService.getBalance.mockResolvedValue({ cash: 1000 });
      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      const result = await service.attack('attacker', 'defender');

      expect(ruleService.validateCombatAttack).toHaveBeenCalledWith({ attackerId: 'attacker', defenderId: 'defender', attackType: 'standard', energyCost: 10 });
      expect(energyService.consumeEnergy).toHaveBeenCalledWith('attacker', 10, 'battle-1');
      expect(walletService.transferCash).toHaveBeenCalledWith('defender', 'attacker', 25, 'battle-1');
      expect(eventBus.emit).toHaveBeenCalledWith('combat.battle.completed', result);
      expect(result).toMatchObject({ battleId: 'battle-1', winnerId: 'attacker', loserId: 'defender', success: true, cashStolen: 25 });
      jest.restoreAllMocks();
    });

    it('does not transfer cash when the attacker loses', async () => {
      statService.getEffectiveStats.mockResolvedValueOnce({ attack: 10 }).mockResolvedValueOnce({ defense: 90 });
      walletService.getBalance.mockResolvedValue({ cash: 1000 });
      jest.spyOn(Math, 'random').mockReturnValue(0.99);

      const result = await service.attack('attacker', 'defender');

      expect(result.success).toBe(false);
      expect(result.cashStolen).toBe(0);
      expect(walletService.transferCash).not.toHaveBeenCalled();
      expect(energyService.consumeEnergy).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('propagates RuleService validation failures before side effects', async () => {
      ruleService.validateCombatAttack.mockRejectedValue(new Error('not enough energy'));

      await expect(service.attack('attacker', 'defender')).rejects.toThrow('not enough energy');

      expect(statService.getEffectiveStats).not.toHaveBeenCalled();
      expect(walletService.transferCash).not.toHaveBeenCalled();
      expect(energyService.consumeEnergy).not.toHaveBeenCalled();
    });

    it('rejects self attacks', async () => {
      await expect(service.attack('same', 'same')).rejects.toBeInstanceOf(BadRequestException);
      expect(ruleService.validateCombatAttack).not.toHaveBeenCalled();
    });
  });

  describe('calculateWinProbability', () => {
    it('calculates probability from effective stats', async () => {
      statService.getEffectiveStats.mockResolvedValueOnce({ attack: 60, speed: 20, luck: 10 }).mockResolvedValueOnce({ defense: 30, speed: 4, luck: 0 });
      await expect(service.calculateWinProbability('a', 'd')).resolves.toBe(0.68);
    });

    it('clamps extreme probabilities', async () => {
      statService.getEffectiveStats.mockResolvedValueOnce({ attack: 100000 }).mockResolvedValueOnce({ defense: 1 });
      await expect(service.calculateWinProbability('a', 'd')).resolves.toBe(COMBAT_DEFAULTS.maxWinProbability);
    });

    it('rejects missing players', async () => {
      await expect(service.calculateWinProbability('', 'd')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('calculateCashReward', () => {
    it('returns 50% of the max 5% defender cash steal', async () => {
      walletService.getBalance.mockResolvedValue({ cash: 999 });
      await expect(service.calculateCashReward('a', 'd')).resolves.toBe(24);
    });

    it('never returns negative rewards for negative balances', async () => {
      walletService.getBalance.mockResolvedValue({ cash: -100 });
      await expect(service.calculateCashReward('a', 'd')).resolves.toBe(0);
    });
  });

  describe('createBattleLog', () => {
    it('persists and maps a battle log with Prisma', async () => {
      const log = await service.createBattleLog({ attackerId: 'a', defenderId: 'd', attackType: 'critical', success: true, cashStolen: 5, probability: 0.75, metadata: { critical: true } });
      expect(prisma.battle.create).toHaveBeenCalledWith({ data: { attackerId: 'a', defenderId: 'd', action: 'critical', success: true, cashStolen: 5, probability: 0.75, metadata: { critical: true } } });
      expect(log).toMatchObject({ id: 'battle-1', attackType: 'critical', metadata: { critical: true } });
    });
  });

  describe('generateBattleResult', () => {
    it('creates a winning result and battle log deterministically', async () => {
      const result = await service.generateBattleResult({ attackerId: 'a', defenderId: 'd', winProbability: 0.8, cashReward: 10, randomRoll: 0.2 });
      expect(result).toMatchObject({ winnerId: 'a', loserId: 'd', success: true, cashStolen: 10, energySpent: 10 });
      expect(prisma.battle.create).toHaveBeenCalled();
    });

    it('creates a losing result with no stolen cash', async () => {
      const result = await service.generateBattleResult({ attackerId: 'a', defenderId: 'd', winProbability: 0.2, cashReward: 10, randomRoll: 0.9 });
      expect(result).toMatchObject({ winnerId: 'd', loserId: 'a', success: false, cashStolen: 0 });
    });
  });
});
