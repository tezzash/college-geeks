import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  const service = new WalletService();

  it('credits and debits cash with ledger entries', () => {
    const credited = service.credit({ playerId: 'p1', cash: 100 }, 25, 'job_reward', 'job-1', 'idem-1');
    assert.equal(credited.account.cash, 125);
    assert.deepEqual(credited.ledgerEntry, {
      playerId: 'p1',
      type: 'job_reward',
      amount: 25,
      balanceAfter: 125,
      reference: 'job-1',
      idempotencyKey: 'idem-1',
    });

    const debited = service.debit(credited.account, 10, 'tower_room_unlock');
    assert.equal(debited.account.cash, 115);
  });

  it('transfers cash between two players', () => {
    const result = service.transfer({ playerId: 'victim', cash: 100 }, { playerId: 'attacker', cash: 50 }, 12.345, 'battle-1');

    assert.equal(result.debit.account.cash, 87.66);
    assert.equal(result.credit.account.cash, 62.35);
    assert.equal(result.debit.ledgerEntry.type, 'pvp_steal_debit');
    assert.equal(result.credit.ledgerEntry.type, 'pvp_steal_credit');
  });

  it('rejects unsafe wallet operations', () => {
    assert.throws(() => service.credit({ playerId: '', cash: 1 }, 1, 'job_reward'), /playerId/);
    assert.throws(() => service.credit({ playerId: 'p1', cash: 1 }, 0, 'job_reward'), /positive/);
    assert.throws(() => service.debit({ playerId: 'p1', cash: 1 }, 2, 'ally_hire'), /Insufficient/);
    assert.throws(() => service.transfer({ playerId: 'p1', cash: 5 }, { playerId: 'p1', cash: 5 }, 1, 'battle-1'), /same player/);
  });
});
