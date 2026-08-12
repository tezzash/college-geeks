import { WalletAccount, WalletLedgerEntry, WalletOperationResult, WalletTransactionType } from './wallet.types';

export class WalletService {
  credit(account: WalletAccount, amount: number, type: WalletTransactionType, reference?: string, idempotencyKey?: string): WalletOperationResult {
    this.validateAccount(account);
    this.validateAmount(amount, 'credit amount');
    return this.apply(account, amount, type, reference, idempotencyKey);
  }

  debit(account: WalletAccount, amount: number, type: WalletTransactionType, reference?: string, idempotencyKey?: string): WalletOperationResult {
    this.validateAccount(account);
    this.validateAmount(amount, 'debit amount');
    if (account.cash < amount) throw new Error('Insufficient cash.');
    return this.apply(account, -amount, type, reference, idempotencyKey);
  }

  transfer(source: WalletAccount, destination: WalletAccount, amount: number, reference: string): { debit: WalletOperationResult; credit: WalletOperationResult } {
    if (source.playerId === destination.playerId) throw new Error('Cannot transfer cash to the same player.');
    const debit = this.debit(source, amount, 'pvp_steal_debit', reference);
    const credit = this.credit(destination, amount, 'pvp_steal_credit', reference);
    return { debit, credit };
  }

  private apply(account: WalletAccount, delta: number, type: WalletTransactionType, reference?: string, idempotencyKey?: string): WalletOperationResult {
    const nextAccount = { ...account, cash: this.roundCurrency(account.cash + delta) };
    const ledgerEntry: WalletLedgerEntry = {
      playerId: account.playerId,
      type,
      amount: this.roundCurrency(delta),
      balanceAfter: nextAccount.cash,
      reference,
      idempotencyKey,
    };
    return { account: nextAccount, ledgerEntry };
  }

  private validateAccount(account: WalletAccount): void {
    if (!account.playerId.trim()) throw new Error('playerId is required.');
    if (!Number.isFinite(account.cash) || account.cash < 0) throw new Error('Account cash must be non-negative.');
  }

  private validateAmount(amount: number, name: string): void {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error(`${name} must be positive.`);
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
