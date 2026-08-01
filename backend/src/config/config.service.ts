import { PrismaService, sql } from '../database/prisma.service';

type GameConfigRow = {
  key: string;
  value: string | number | boolean | null;
};

export class ConfigNotFoundError extends Error {
  constructor(key: string) {
    super(`Config value not found for key: ${key}`);
    this.name = 'ConfigNotFoundError';
  }
}

export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string> {
    const row = await this.findConfigRow(key);

    if (row.value === null || row.value === undefined) {
      throw new ConfigNotFoundError(key);
    }

    return String(row.value);
  }

  async getNumber(key: string): Promise<number> {
    const value = await this.get(key);
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      throw new TypeError(`Config value for key ${key} is not a valid number`);
    }

    return parsed;
  }

  async getBoolean(key: string): Promise<boolean> {
    const value = (await this.get(key)).trim().toLowerCase();

    if (['true', '1', 'yes', 'y', 'on'].includes(value)) {
      return true;
    }

    if (['false', '0', 'no', 'n', 'off'].includes(value)) {
      return false;
    }

    throw new TypeError(`Config value for key ${key} is not a valid boolean`);
  }

  private async findConfigRow(key: string): Promise<GameConfigRow> {
    const rows = await this.prisma.$queryRaw<GameConfigRow[]>(
      sql`SELECT key, value FROM game_config WHERE key = ${key} LIMIT 1`,
    );

    const row = rows[0];
    if (!row) {
      throw new ConfigNotFoundError(key);
    }

    return row;
  }
}
