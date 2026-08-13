import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CombatService } from '../combat';
import { ALPHA_GAME_CONFIG } from '../game-config';
import { PlayerService } from '../player';
import { BattleService } from './battle.service';

test('winning a punch spends energy and steals the configured cash rate', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com', power: 100 });
  players.create({ id: 'p2', username: 'bob', email: 'bob@example.com', cash: 2000, power: 10 });
  const combat = new CombatService(ALPHA_GAME_CONFIG, () => 0);
  const battle = new BattleService(players, combat, ALPHA_GAME_CONFIG);

  const result = battle.fight('p1', 'p2', 'punch');

  assert.equal(result.success, true);
  assert.equal(result.energySpent, 1);
  assert.equal(result.cashTransferred, 100);
  assert.equal(players.get('p1').energy, 9);
  assert.equal(players.get('p1').cash, 1100);
  assert.equal(players.get('p2').cash, 1900);
});

test('losing a battle still spends energy but transfers no cash', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com', power: 1 });
  players.create({ id: 'p2', username: 'bob', email: 'bob@example.com', cash: 2000, power: 100 });
  const combat = new CombatService(ALPHA_GAME_CONFIG, () => 0.99);
  const battle = new BattleService(players, combat, ALPHA_GAME_CONFIG);

  const result = battle.fight('p1', 'p2', 'punch');

  assert.equal(result.success, false);
  assert.equal(result.cashTransferred, 0);
  assert.equal(players.get('p1').energy, 9);
  assert.equal(players.get('p1').cash, 1000);
  assert.equal(players.get('p2').cash, 2000);
});

test('rejects a battle without enough energy', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com', energy: 0 });
  players.create({ id: 'p2', username: 'bob', email: 'bob@example.com' });
  const battle = new BattleService(players, new CombatService(ALPHA_GAME_CONFIG), ALPHA_GAME_CONFIG);

  assert.throws(() => battle.fight('p1', 'p2', 'punch'), /Insufficient energy/);
});
