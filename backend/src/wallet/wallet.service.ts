import { Injectable } from '@nestjs/common';
@Injectable()
export class WalletService { getBalance(_playerId: string): Promise<number> { return Promise.resolve(0); } }
