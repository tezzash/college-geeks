import { ConfigNotFoundError, ConfigService, GameConfigRow } from './config-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

const createService = (rows: GameConfigRow[]) => {
  const calls: any[] = [];
  const prisma = {
    async $queryRaw(query: any) {
      calls.push(query);
      return rows;
    },
  } as unknown as PrismaService;

  return {
    service: new ConfigService(prisma),
    calls,
  };
};

describe('ConfigService', () => {
  it('reads string values from the game_config table', async () => {
    const { service, calls } = createService([{ key: 'starting_cash', value: '100' }]);

    expect(await service.get('starting_cash')).toEqual('100');
    expect(calls.length).toEqual(1);

    // In NestJS/Prisma, the query argument object has a 'text' property containing the string query.
    // However, Prisma.sql returns a Sql object, which has `text` and `values` on it.
    expect(calls[0].text).toMatch(/FROM game_config/);
    expect(calls[0].values).toEqual(['starting_cash']);
  });

  it('converts numeric config values', async () => {
    const { service } = createService([{ key: 'energy_regen_seconds', value: '45' }]);

    expect(await service.getNumber('energy_regen_seconds')).toEqual(45);
  });

  it('rejects non-numeric values requested as numbers', async () => {
    const { service } = createService([{ key: 'energy_regen_seconds', value: 'fast' }]);

    await expect(service.getNumber('energy_regen_seconds')).rejects.toThrow(TypeError);
  });

  for (const [rawValue, expected] of [
    ['true', true],
    ['1', true],
    ['yes', true],
    ['on', true],
    ['false', false],
    ['0', false],
    ['no', false],
    ['off', false],
  ]) {
    it(`converts boolean config value ${rawValue}`, async () => {
      const { service } = createService([{ key: 'feature_enabled', value: rawValue as string }]);

      expect(await service.getBoolean('feature_enabled')).toEqual(expected);
    });
  }

  it('rejects non-boolean values requested as booleans', async () => {
    const { service } = createService([{ key: 'feature_enabled', value: 'sometimes' }]);

    await expect(service.getBoolean('feature_enabled')).rejects.toThrow(TypeError);
  });

  it('throws ConfigNotFoundError when the key does not exist', async () => {
    const { service } = createService([]);

    await expect(service.get('missing_key')).rejects.toThrow(ConfigNotFoundError);
  });
});
