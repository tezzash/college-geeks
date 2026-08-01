import { Injectable } from '@nestjs/common';
@Injectable()
export class EnergyService { getEnergy(_playerId: string): Promise<number> { return Promise.resolve(0); } }
