import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALPHA_GAME_CONFIG, GameConfigService } from './game-config.service';

describe('GameConfigService', () => {
  it('returns a copy of the alpha config', () => {
    const service = new GameConfigService();
    const config = service.getConfig();
    config.startingCash = 0;

    assert.equal(service.getConfig().version, 'alpha-0.1');
    assert.equal(service.getConfig().startingCash, ALPHA_GAME_CONFIG.startingCash);
  });

  it('rejects invalid config values', () => {
    assert.throws(() => new GameConfigService({ ...ALPHA_GAME_CONFIG, version: '' }), /version/);
    assert.throws(() => new GameConfigService({ ...ALPHA_GAME_CONFIG, maxEnergy: 10.5 }), /Energy/);
    assert.throws(() => new GameConfigService({ ...ALPHA_GAME_CONFIG, maxWinProbability: 1.1 }), /Win probability/);
  });
});
