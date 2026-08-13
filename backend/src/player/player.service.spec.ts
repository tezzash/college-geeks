import assert from 'node:assert/strict';
import test from 'node:test';
import { PlayerService } from './player.service';

test('creates a player with the game defaults', () => {
  const service = new PlayerService();
  const player = service.create({ id: 'p1', username: 'tezz', email: 'tezz@example.com' });

  assert.equal(player.cash, 1000);
  assert.equal(player.energy, 10);
  assert.equal(player.power, 0);
  assert.equal(player.smartness, 0);
});

test('rejects duplicate usernames and emails', () => {
  const service = new PlayerService();
  service.create({ id: 'p1', username: 'tezz', email: 'tezz@example.com' });

  assert.throws(() => service.create({ id: 'p2', username: 'tezz', email: 'other@example.com' }), /Username/);
  assert.throws(() => service.create({ id: 'p3', username: 'other', email: 'tezz@example.com' }), /Email/);
});

test('prevents spending more cash than the player owns', () => {
  const service = new PlayerService();
  service.create({ id: 'p1', username: 'tezz', email: 'tezz@example.com' });

  assert.throws(() => service.spendCash('p1', 1000.01), /Insufficient cash/);
  assert.equal(service.get('p1').cash, 1000);
});

test('updates stats without allowing negative stat values', () => {
  const service = new PlayerService();
  service.create({ id: 'p1', username: 'tezz', email: 'tezz@example.com' });

  service.updateStats('p1', 5, 3);
  assert.deepEqual(service.get('p1'), {
    id: 'p1', username: 'tezz', email: 'tezz@example.com', cash: 1000, energy: 10, power: 5, smartness: 3,
  });
  assert.throws(() => service.updateStats('p1', -1, 0), /powerDelta/);
});
