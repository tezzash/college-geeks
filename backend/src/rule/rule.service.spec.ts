import { RuleService } from './rule.service';

const player = { id: 'player-1' };
const target = { id: 'player-2' };
const job = { id: 'job-1' };
const ally = { id: 'ally-1', hireCost: 75 };

function buildService(overrides: { balance?: number; energy?: number; config?: unknown; prisma?: Record<string, unknown>; stats?: unknown } = {}) {
  const config = overrides.config ?? { pvp: { energyCost: 1, enabled: true }, tower: { roomUnlockCosts: { 2: 250 }, maxRooms: 10 }, jobs: { energyCost: 2, enabled: true } };
  const prisma = {
    player: { findUnique: jest.fn(({ where }: { where: { id: string } }) => Promise.resolve(where.id === player.id ? player : where.id === target.id ? target : null)) },
    ally: { findUnique: jest.fn(({ where }: { where: { id: string } }) => Promise.resolve(where.id === ally.id ? ally : null)) },
    towerRoom: { findFirst: jest.fn(() => Promise.resolve(null)) },
    roomOccupant: { findFirst: jest.fn(() => Promise.resolve(null)) },
    job: { findUnique: jest.fn(({ where }: { where: { id: string } }) => Promise.resolve(where.id === job.id ? job : null)) },
    activeJob: { findFirst: jest.fn(() => Promise.resolve(null)) },
    ...overrides.prisma,
  } as never;
  return {
    service: new RuleService(
      { getGameplayConfig: jest.fn(() => config) } as never,
      { getBalance: jest.fn(() => Promise.resolve(overrides.balance ?? 1000)) } as never,
      { getEnergy: jest.fn(() => Promise.resolve(overrides.energy ?? 10)) } as never,
      { getPlayerStats: jest.fn(() => Promise.resolve(overrides.stats ?? { power: 1, smartness: 1 })) } as never,
      prisma,
    ),
    prisma: prisma as Record<string, { findUnique?: (...args: unknown[]) => unknown; findFirst?: (...args: unknown[]) => unknown }>,
  };
}

describe('RuleService', () => {
  describe('canAttack', () => {
    it('allows a valid attack and returns rule metadata', async () => {
      const { service } = buildService();
      await expect(service.canAttack(player.id, target.id)).resolves.toEqual({ allowed: true, meta: { energyCost: 1 } });
    });

    it.each([
      ['', target.id, 'INVALID_PLAYER_ID'],
      [player.id, '', 'INVALID_TARGET_ID'],
      [player.id, player.id, 'SELF_TARGET_NOT_ALLOWED'],
    ])('rejects invalid attack input %#', async (attackerId, defenderId, reason) => {
      const { service } = buildService();
      await expect(service.canAttack(attackerId, defenderId)).resolves.toMatchObject({ allowed: false, reason });
    });

    it('rejects disabled pvp before querying mutable engines', async () => {
      const { service } = buildService({ config: { pvp: { energyCost: 1, enabled: false }, tower: { roomUnlockCosts: {}, maxRooms: 10 }, jobs: { energyCost: 0, enabled: true } } });
      await expect(service.canAttack(player.id, target.id)).resolves.toMatchObject({ allowed: false, reason: 'PVP_DISABLED' });
    });

    it('rejects attackers without enough energy', async () => {
      const { service } = buildService({ energy: 0 });
      await expect(service.canAttack(player.id, target.id)).resolves.toMatchObject({ allowed: false, reason: 'NOT_ENOUGH_ENERGY', meta: { required: 1, available: 0 } });
    });
  });

  describe('canHireAlly', () => {
    it('allows hiring an affordable ally', async () => {
      const { service } = buildService();
      await expect(service.canHireAlly(player.id, ally.id)).resolves.toMatchObject({ allowed: true });
    });

    it('rejects missing allies', async () => {
      const { service } = buildService();
      await expect(service.canHireAlly(player.id, 'missing')).resolves.toMatchObject({ allowed: false, reason: 'ALLY_NOT_FOUND' });
    });

    it('rejects already hired allies', async () => {
      const { service } = buildService({ prisma: { roomOccupant: { findFirst: jest.fn(() => Promise.resolve({ id: 'occupant-1' })) } } });
      await expect(service.canHireAlly(player.id, ally.id)).resolves.toMatchObject({ allowed: false, reason: 'ALLY_ALREADY_HIRED' });
    });

    it('rejects unaffordable allies through centralized cash validation', async () => {
      const { service } = buildService({ balance: 10 });
      await expect(service.canHireAlly(player.id, ally.id)).resolves.toMatchObject({ allowed: false, reason: 'NOT_ENOUGH_CASH' });
    });
  });

  describe('canUnlockRoom', () => {
    it('allows unlocking an affordable locked room', async () => {
      const { service } = buildService();
      await expect(service.canUnlockRoom(player.id, 2)).resolves.toMatchObject({ allowed: true });
    });

    it.each([[0, 'ROOM_NOT_FOUND'], [11, 'ROOM_LIMIT_REACHED']])('rejects invalid room %#', async (roomNumber, reason) => {
      const { service } = buildService();
      await expect(service.canUnlockRoom(player.id, roomNumber as number)).resolves.toMatchObject({ allowed: false, reason });
    });

    it('rejects rooms that are already unlocked', async () => {
      const { service } = buildService({ prisma: { towerRoom: { findFirst: jest.fn(() => Promise.resolve({ roomNumber: 2, unlocked: true, unlockCost: 250 })) } } });
      await expect(service.canUnlockRoom(player.id, 2)).resolves.toMatchObject({ allowed: false, reason: 'ROOM_ALREADY_UNLOCKED' });
    });
  });

  describe('canStartJob', () => {
    it('allows starting an available job', async () => {
      const { service } = buildService();
      await expect(service.canStartJob(player.id, job.id)).resolves.toEqual({ allowed: true, meta: { energyCost: 2 } });
    });

    it('rejects missing jobs', async () => {
      const { service } = buildService();
      await expect(service.canStartJob(player.id, 'missing')).resolves.toMatchObject({ allowed: false, reason: 'JOB_NOT_FOUND' });
    });

    it('rejects players who already have an active job', async () => {
      const { service } = buildService({ prisma: { activeJob: { findFirst: jest.fn(() => Promise.resolve({ id: 'active-1' })) } } });
      await expect(service.canStartJob(player.id, job.id)).resolves.toMatchObject({ allowed: false, reason: 'ACTIVE_JOB_EXISTS' });
    });

    it('rejects jobs when the player lacks energy', async () => {
      const { service } = buildService({ energy: 1 });
      await expect(service.canStartJob(player.id, job.id)).resolves.toMatchObject({ allowed: false, reason: 'NOT_ENOUGH_ENERGY' });
    });
  });

  describe('canCollectJob', () => {
    it('allows collecting a finished job', async () => {
      const finished = new Date(Date.now() - 1000);
      const { service } = buildService({ prisma: { activeJob: { findFirst: jest.fn(() => Promise.resolve({ id: 'active-1', finishesAt: finished, collected: false })) } } });
      await expect(service.canCollectJob(player.id)).resolves.toEqual({ allowed: true, meta: { activeJobId: 'active-1' } });
    });

    it('rejects players without active jobs', async () => {
      const { service } = buildService();
      await expect(service.canCollectJob(player.id)).resolves.toMatchObject({ allowed: false, reason: 'NO_ACTIVE_JOB' });
    });

    it('rejects unfinished jobs', async () => {
      const future = new Date(Date.now() + 60_000);
      const { service } = buildService({ prisma: { activeJob: { findFirst: jest.fn(() => Promise.resolve({ id: 'active-1', finishesAt: future, collected: false })) } } });
      await expect(service.canCollectJob(player.id)).resolves.toMatchObject({ allowed: false, reason: 'JOB_NOT_READY' });
    });
  });

  describe('canSpendCash', () => {
    it('allows spending available cash', async () => {
      const { service } = buildService({ balance: 100 });
      await expect(service.canSpendCash(player.id, 100)).resolves.toEqual({ allowed: true, meta: { required: 100, available: 100 } });
    });

    it.each([[-1], [Number.NaN]])('rejects invalid amounts %#', async (amount) => {
      const { service } = buildService();
      await expect(service.canSpendCash(player.id, amount)).resolves.toMatchObject({ allowed: false, reason: 'INVALID_AMOUNT' });
    });

    it('rejects players with insufficient cash', async () => {
      const { service } = buildService({ balance: 99 });
      await expect(service.canSpendCash(player.id, 100)).resolves.toMatchObject({ allowed: false, reason: 'NOT_ENOUGH_CASH', meta: { required: 100, available: 99 } });
    });
  });
});
