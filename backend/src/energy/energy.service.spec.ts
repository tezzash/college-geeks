import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALPHA_GAME_CONFIG } from '../game-config';
import { EnergyService } from './energy.service';

const service = new EnergyService(ALPHA_GAME_CONFIG);
const start = new Date('2026-08-12T00:00:00.000Z');

describe('EnergyService', () => {
  it('regenerates energy based on elapsed configured intervals', () => {
    const result = service.regenerate({ energy: 5, lastEnergyUpdate: start }, new Date('2026-08-12T00:14:30.000Z'));

    assert.equal(result.energy, 7);
    assert.equal(result.lastEnergyUpdate.toISOString(), '2026-08-12T00:14:00.000Z');
  });

  it('caps energy at max and uses now when full', () => {
    const result = service.regenerate({ energy: 9, lastEnergyUpdate: start }, new Date('2026-08-12T00:14:00.000Z'));

    assert.equal(result.energy, 10);
    assert.equal(result.lastEnergyUpdate.toISOString(), '2026-08-12T00:14:00.000Z');
  });

  it('spends PvP energy after regeneration', () => {
    const result = service.spendForPvp({ energy: 0, lastEnergyUpdate: start }, new Date('2026-08-12T00:07:00.000Z'));

    assert.equal(result.energy, 0);
  });

  it('rejects invalid energy operations', () => {
    assert.throws(() => service.regenerate({ energy: 11, lastEnergyUpdate: start }, start), /energy/);
    assert.throws(() => service.regenerate({ energy: 1, lastEnergyUpdate: start }, new Date('2026-08-11T23:59:00.000Z')), /before/);
    assert.throws(() => service.spendForPvp({ energy: 0, lastEnergyUpdate: start }, start), /Not enough/);
  });
});
