export type WalletTransactionType =
  | 'starting_cash'
  | 'job_reward'
  | 'tower_room_unlock'
  | 'ally_hire'
  | 'pvp_steal_credit'
  | 'pvp_steal_debit'
  | 'admin_adjustment';

export interface WalletAccount {
  playerId: string;
  cash: number;
}

export interface WalletLedgerEntry {
  playerId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  reference?: string;
  idempotencyKey?: string;
}

export interface WalletOperationResult {
  account: WalletAccount;
  ledgerEntry: WalletLedgerEntry;
}
