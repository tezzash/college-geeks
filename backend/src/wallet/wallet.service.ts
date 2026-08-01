import { Injectable } from '@nestjs/common';

export interface WalletBalance {
  cash: number;
}

@Injectable()
export class WalletService {
  async getBalance(_playerId: string): Promise<WalletBalance> {
    throw new Error('WalletService.getBalance is provided by the Wallet Engine');
  }

  async transferCash(_fromPlayerId: string, _toPlayerId: string, _amount: number, _reference: string): Promise<void> {
    throw new Error('WalletService.transferCash is provided by the Wallet Engine');
  }
}
