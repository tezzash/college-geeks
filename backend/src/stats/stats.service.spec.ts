import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  const service = new StatsService();

  it('calculates total stats from allies', () => {
    assert.deepEqual(service.calculate([
      { power: 10, smartness: 5 },
      { power: 3, smartness: 12 },
    ]), { power: 13, smartness: 17 });
  });

  it('returns zero totals for empty ally lists', () => {
    assert.deepEqual(service.calculate([]), { power: 0, smartness: 0 });
  });

  it('rejects invalid ally stats', () => {
    assert.throws(() => service.calculate([{ power: -1, smartness: 0 }]), /allies\[0\]/);
  });
});
