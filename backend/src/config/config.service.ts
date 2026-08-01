import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  getMaxEnergy(): number {
    return this.readPositiveInt('MAX_ENERGY', 10);
  }

  getEnergyRegenIntervalSeconds(): number {
    return this.readPositiveInt('ENERGY_REGEN_INTERVAL_SECONDS', 7 * 60);
  }

  private readPositiveInt(key: string, fallback: number): number {
    const rawValue = process.env[key];
    if (rawValue === undefined) {
      return fallback;
    }

    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) {
      return fallback;
    }

    return value;
  }
}
