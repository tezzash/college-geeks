import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from './auth.service';

const player = { id: 'p1', username: 'alice', email: 'alice@example.com', cash: 1000, energy: 10, power: 0, smartness: 0 };

test('registers with a hashed password and returns an access token', async () => {
  let storedHash = '';
  const players = {
    create: async (input: { passwordHash: string }) => {
      storedHash = input.passwordHash;
      return player;
    },
    findCredentials: async () => null,
  };
  const auth = new AuthService(players as never, '12345678901234567890123456789012');

  const result = await auth.register({ username: 'alice', email: 'alice@example.com', password: 'password123' });
  assert.equal(result.player.id, 'p1');
  assert.match(result.accessToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.match(storedHash, /^scrypt\$/);
  assert.equal(auth.verifyToken(result.accessToken), 'p1');
});

test('rejects invalid login credentials', async () => {
  const players = {
    create: async () => player,
    findCredentials: async () => ({ player, passwordHash: 'scrypt$bad$00' }),
  };
  const auth = new AuthService(players as never, '12345678901234567890123456789012');
  await assert.rejects(() => auth.login({ login: 'alice', password: 'wrongpass' }), /Invalid credentials/);
});
