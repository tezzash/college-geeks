import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HealthService } from './health.service';

const fixedDate = new Date('2026-08-12T00:00:00.000Z');

describe('HealthService', () => {
  it('returns a stable health report', () => {
    const health = new HealthService({ environment: 'test', port: 3000, corsOrigin: 'http://localhost:3000' }, () => fixedDate);

    assert.deepEqual(health.check(), {
      status: 'ok',
      service: 'college-geeks-backend',
      environment: 'test',
      timestamp: '2026-08-12T00:00:00.000Z',
    });
  });
});
