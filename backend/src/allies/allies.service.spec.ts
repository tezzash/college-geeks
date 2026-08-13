import assert from 'node:assert/strict';
import test from 'node:test';
import { PlayerService } from '../player';
import { AlliesService } from './allies.service';

test('hires an ally and applies its stat bonus', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com' });
  const allies = new AlliesService(players);
  allies.registerAlly({ id: 'mentor', name: 'Mentor', cost: 250, powerBonus: 1, smartnessBonus: 4 });

  allies.hire('p1', 'mentor');
  assert.equal(players.get('p1').cash, 750);
  assert.equal(players.get('p1').power, 1);
  assert.equal(players.get('p1').smartness, 4);
  assert.equal(allies.listHired('p1').length, 1);
});

test('prevents hiring the same ally twice', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com' });
  const allies = new AlliesService(players);
  allies.registerAlly({ id: 'mentor', name: 'Mentor', cost: 100, powerBonus: 1, smartnessBonus: 0 });
  allies.hire('p1', 'mentor');

  assert.throws(() => allies.hire('p1', 'mentor'), /already hired/);
});
