const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ConfigNotFoundError, ConfigService } = require('../dist/config/config.service');

const createService = (rows) => {
  const calls = [];
  const prisma = {
    async $queryRaw(query) {
      calls.push(query);
      return rows;
    },
  };

  return {
    service: new ConfigService(prisma),
    calls,
  };
};

describe('ConfigService', () => {
  it('reads string values from the game_config table', async () => {
    const { service, calls } = createService([{ key: 'starting_cash', value: '100' }]);

    assert.equal(await service.get('starting_cash'), '100');
    assert.equal(calls.length, 1);
    assert.match(calls[0].text, /FROM game_config/);
    assert.deepEqual(calls[0].values, ['starting_cash']);
  });

  it('converts numeric config values', async () => {
    const { service } = createService([{ key: 'energy_regen_seconds', value: '45' }]);

    assert.equal(await service.getNumber('energy_regen_seconds'), 45);
  });

  it('rejects non-numeric values requested as numbers', async () => {
    const { service } = createService([{ key: 'energy_regen_seconds', value: 'fast' }]);

    await assert.rejects(() => service.getNumber('energy_regen_seconds'), TypeError);
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
      const { service } = createService([{ key: 'feature_enabled', value: rawValue }]);

      assert.equal(await service.getBoolean('feature_enabled'), expected);
    });
  }

  it('rejects non-boolean values requested as booleans', async () => {
    const { service } = createService([{ key: 'feature_enabled', value: 'sometimes' }]);

    await assert.rejects(() => service.getBoolean('feature_enabled'), TypeError);
  });

  it('throws ConfigNotFoundError when the key does not exist', async () => {
    const { service } = createService([]);

    await assert.rejects(() => service.get('missing_key'), ConfigNotFoundError);
  });
});
