import { Injectable } from '@nestjs/common';

export interface EffectiveStats {
  attack: number;
  defense: number;
  speed?: number;
  luck?: number;
}

@Injectable()
export class StatService {
  async getEffectiveStats(_playerId: string): Promise<EffectiveStats> {
    throw new Error('StatService.getEffectiveStats is provided by the Stat Engine');
  }
}
