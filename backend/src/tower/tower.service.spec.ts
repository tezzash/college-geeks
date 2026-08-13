import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlayerService } from '../player';
import { TowerService } from './tower.service';

test('purchases a tower room and applies its stat bonus', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com' });
  const tower = new TowerService(players);
  tower.registerRoom({ id: 'library', name: 'Library', cost: 300, powerBonus: 0, smartnessBonus: 5 });

  tower.purchase('p1', 'library');
  assert.equal(players.get('p1').cash, 700);
  assert.equal(players.get('p1').smartness, 5);
  assert.equal(tower.listOwned('p1').length, 1);
});

test('prevents buying the same room twice', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com' });
  const tower = new TowerService(players);
  tower.registerRoom({ id: 'gym', name: 'Gym', cost: 100, powerBonus: 5, smartnessBonus: 0 });
  tower.purchase('p1', 'gym');

  assert.throws(() => tower.purchase('p1', 'gym'), /already owned/);
});

test('does not allow a purchase without enough cash', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com', cash: 50 });
  const tower = new TowerService(players);
  tower.registerRoom({ id: 'gym', name: 'Gym', cost: 100, powerBonus: 5, smartnessBonus: 0 });

  assert.throws(() => tower.purchase('p1', 'gym'), /Insufficient cash/);
  assert.equal(tower.listOwned('p1').length, 0);
});
