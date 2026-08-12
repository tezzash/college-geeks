import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALPHA_GAME_CONFIG } from '../game-config';
import { CombatService } from './combat.service';

describe('CombatService', () => {
  it('calculates punch and face-off probabilities from the correct stat', () => {
    const service = new CombatService(ALPHA_GAME_CONFIG, () => 0);
    const powerSpecialist = { power: 90, smartness: 10 };
    const smartnessSpecialist = { power: 10, smartness: 90 };

    assert.equal(service.calculateWinProbability('punch', powerSpecialist, smartnessSpecialist), 0.9);
    assert.equal(service.calculateWinProbability('face-off', powerSpecialist, smartnessSpecialist), 0.1);
  });

  it('resolves success using the injected random source', () => {
    const success = new CombatService(ALPHA_GAME_CONFIG, () => 0.1).resolve('punch', { power: 50, smartness: 0 }, { power: 50, smartness: 0 });
    const failure = new CombatService(ALPHA_GAME_CONFIG, () => 0.9).resolve('punch', { power: 50, smartness: 0 }, { power: 50, smartness: 0 });

    assert.equal(success.success, true);
    assert.equal(failure.success, false);
  });

  it('handles zero stats as even combat', () => {
    assert.equal(new CombatService(ALPHA_GAME_CONFIG).calculateWinProbability('punch', { power: 0, smartness: 0 }, { power: 0, smartness: 0 }), 0.5);
  });

  it('rejects invalid combat stats', () => {
    assert.throws(() => new CombatService(ALPHA_GAME_CONFIG).resolve('punch', { power: -1, smartness: 0 }, { power: 0, smartness: 0 }), /attacker/);
  });
});
