export enum WalletTransactionType {
  JobReward = 'job_reward',
  TowerRoomUnlock = 'tower_room_unlock',
  AllyHire = 'ally_hire',
  PvpReward = 'pvp_reward',
  PvpLoss = 'pvp_loss',
  AdminAdjustment = 'admin_adjustment',
  Transfer = 'transfer',
}

export interface WalletBalance {
  playerId: string;
  cash: number;
}

export interface WalletTransactionResult extends WalletBalance {
  transactionId: string;
}

export interface WalletTransferResult {
  from: WalletTransactionResult;
  to: WalletTransactionResult;
}

export type PrismaTransactionClient = {
  player: {
    findUnique(args: unknown): Promise<{ id: string; cash: number } | null>;
    update(args: unknown): Promise<{ id: string; cash: number }>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  cashTransaction: {
    create(args: unknown): Promise<{ id: string; playerId: string; amount: number }>;
  };
};
