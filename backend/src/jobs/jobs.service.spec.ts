import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlayerService } from '../player';
import { JobsService } from './jobs.service';

test('starts a job and exposes its finish time', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com' });
  const now = new Date('2026-01-01T00:00:00.000Z');
  const jobs = new JobsService(players, () => now);
  jobs.register({ id: 'job-1', name: 'Study', durationSeconds: 60, rewardCash: 100 });

  const result = jobs.start('p1', 'job-1');
  assert.equal(result.activeJob.finishesAt.toISOString(), '2026-01-01T00:01:00.000Z');
});

test('prevents collection before completion and rewards after completion', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com' });
  let now = new Date('2026-01-01T00:00:00.000Z');
  const jobs = new JobsService(players, () => now);
  jobs.register({ id: 'job-1', name: 'Study', durationSeconds: 60, rewardCash: 125.5 });
  const active = jobs.start('p1', 'job-1').activeJob;

  assert.throws(() => jobs.collect('p1', active.id), /not finished/);
  now = new Date('2026-01-01T00:01:00.000Z');
  const result = jobs.collect('p1', active.id);

  assert.equal(result.rewardCash, 125.5);
  assert.equal(players.get('p1').cash, 1125.5);
  assert.equal(result.activeJob.collected, true);
});

test('allows only one active job per player', () => {
  const players = new PlayerService();
  players.create({ id: 'p1', username: 'alice', email: 'alice@example.com' });
  const jobs = new JobsService(players);
  jobs.register({ id: 'job-1', name: 'Study', durationSeconds: 60, rewardCash: 100 });
  jobs.register({ id: 'job-2', name: 'Work', durationSeconds: 60, rewardCash: 200 });
  jobs.start('p1', 'job-1');

  assert.throws(() => jobs.start('p1', 'job-2'), /already has an active job/);
});
