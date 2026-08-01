import { Injectable } from '@nestjs/common';

@Injectable()
export class EnergyService {
  async consumeEnergy(_playerId: string, _amount: number, _reference: string): Promise<void> {
    throw new Error('EnergyService.consumeEnergy is provided by the Energy Engine');
  }
}
