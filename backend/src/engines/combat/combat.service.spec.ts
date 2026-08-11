import { BadRequestException } from '@nestjs/common';
import { CombatService } from './combat.service';
import { COMBAT_DEFAULTS } from './combat.types';

describe('CombatService', () => {
  const createdAt = new Date('2026-08-01T00:00:00.000Z');
  let service: CombatService;
  let prisma: any;
  let walletService: any;
  let statService: any;
  let ruleService: any;
  let energyService: any;

  beforeEach(() => {
    prisma = {
      battle: {
        create: jest.fn(async ({ data }) => ({ id: 'battle-1', createdAt, ...data })),
      },
    };
    walletService = { getBalance: jest.fn(), transfer: jest.fn() };
    statService = { calculate: jest.fn() };
    ruleService = { canAttack: jest.fn() };
    energyService = { consume: jest.fn() };
    service = new CombatService(prisma, walletService, statService, ruleService, energyService);
  });

  describe('attack', () => {
    it('executes a successful PvP attack through foundation engines', async () => {
      statService.calculate.mockResolvedValueOnce({ power: 90, smartness: 10 }).mockResolvedValueOnce({ power: 10, smartness: 90 });
      walletService.getBalance.mockResolvedValue({ cash: 1000 });
      ruleService.canAttack.mockResolvedValue({ allowed: true });
      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      const result = await service.attack('attacker', 'defender');

      expect(ruleService.canAttack).toHaveBeenCalledWith('attacker', 'defender');
      expect(energyService.consume).toHaveBeenCalledWith('attacker', 10);
      expect(walletService.transfer).toHaveBeenCalledWith('defender', 'attacker', 25, 'COMBAT_STEAL', 'battle-1');
      expect(result).toMatchObject({ battleId: 'battle-1', winnerId: 'attacker', loserId: 'defender', success: true, cashStolen: 25 });
      jest.restoreAllMocks();
    });

    it('does not transfer cash when the attacker loses', async () => {
      statService.calculate.mockResolvedValueOnce({ power: 10, smartness: 90 }).mockResolvedValueOnce({ power: 90, smartness: 10 });
      walletService.getBalance.mockResolvedValue({ cash: 1000 });
      ruleService.canAttack.mockResolvedValue({ allowed: true });
      jest.spyOn(Math, 'random').mockReturnValue(0.99);

      const result = await service.attack('attacker', 'defender');

      expect(result.success).toBe(false);
      expect(result.cashStolen).toBe(0);
      expect(walletService.transfer).not.toHaveBeenCalled();
      expect(energyService.consume).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('propagates RuleService validation failures before side effects', async () => {
      ruleService.canAttack.mockResolvedValue({ allowed: false, reason: 'NOT_ENOUGH_ENERGY' });

      await expect(service.attack('attacker', 'defender')).rejects.toThrow('Cannot attack: NOT_ENOUGH_ENERGY');

      expect(statService.calculate).not.toHaveBeenCalled();
      expect(walletService.transfer).not.toHaveBeenCalled();
      expect(energyService.consume).not.toHaveBeenCalled();
    });

    it('rejects self attacks', async () => {
      await expect(service.attack('same', 'same')).rejects.toBeInstanceOf(BadRequestException);
      expect(ruleService.canAttack).not.toHaveBeenCalled();
    });
  });

  describe('calculateWinProbability', () => {
    it('calculates probability from effective stats', async () => {
      statService.calculate.mockResolvedValueOnce({ power: 60, smartness: 20 }).mockResolvedValueOnce({ power: 30, smartness: 4 });
      await expect(service.calculateWinProbability('a', 'd')).resolves.toBe(0.6771);
    });

    it('clamps extreme probabilities', async () => {
      statService.calculate.mockResolvedValueOnce({ power: 100000, smartness: 0 }).mockResolvedValueOnce({ power: 1, smartness: 0 });
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
      // Prisma mock will return the metadata as it was created (a JSON string).
      // createBattleLog casts it to Record<string, unknown> in the return object mapping.
      // So we'll pass the JSON string in the mock return value to match runtime behavior.
      prisma.battle.create.mockResolvedValueOnce({ id: 'battle-1', createdAt, action: 'critical', metadata: { critical: true } });

      const log = await service.createBattleLog({ attackerId: 'a', defenderId: 'd', attackType: 'critical', success: true, cashStolen: 5, probability: 0.75, metadata: { critical: true } });
      expect(prisma.battle.create).toHaveBeenCalledWith({ data: { attackerId: 'a', defenderId: 'd', action: 'critical', success: true, cashStolen: 5, probability: 0.75, metadata: JSON.stringify({ critical: true }) } });
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
