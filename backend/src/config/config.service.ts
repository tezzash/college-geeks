import { Injectable } from '@nestjs/common';

export interface GameplayConfig {
  pvp: { energyCost: number; enabled: boolean };
  tower: { roomUnlockCosts: Record<number, number>; maxRooms: number };
  jobs: { energyCost: number; enabled: boolean };
}

@Injectable()
export class ConfigService {
  getGameplayConfig(): GameplayConfig {
    return { pvp: { energyCost: 1, enabled: true }, tower: { roomUnlockCosts: {}, maxRooms: 0 }, jobs: { energyCost: 0, enabled: true } };
  }
}
