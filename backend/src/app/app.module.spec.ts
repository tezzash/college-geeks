import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppModule } from './app.module';

test('wires the database-backed gameplay services', () => {
  const app = new AppModule();

  assert.ok(app.prisma);
  assert.ok(app.databasePlayerService);
  assert.ok(app.databaseJobsService);
  assert.ok(app.databaseTowerService);
  assert.ok(app.databaseAlliesService);
  assert.ok(app.databaseBattleService);
});
