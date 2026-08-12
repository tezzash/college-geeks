import { AppConfig } from './config.types';

type EnvironmentReader = Record<string, string | undefined>;

const DEFAULT_PORT = 3000;
const DEFAULT_CORS_ORIGIN = 'http://localhost:3000';
const VALID_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export class ConfigService {
  constructor(private readonly env: EnvironmentReader = process.env) {}

  load(): AppConfig {
    const environment = this.readEnvironment();
    const port = this.readPort();
    const config: AppConfig = {
      environment,
      port,
      databaseUrl: this.readOptional('DATABASE_URL'),
      jwtSecret: this.readOptional('JWT_SECRET'),
      corsOrigin: this.readOptional('CORS_ORIGIN') ?? DEFAULT_CORS_ORIGIN,
    };

    this.validateProductionSecrets(config);
    return config;
  }

  private readEnvironment(): AppConfig['environment'] {
    const value = this.readOptional('NODE_ENV') ?? 'development';
    if (VALID_ENVIRONMENTS.includes(value as AppConfig['environment'])) {
      return value as AppConfig['environment'];
    }
    throw new Error(`NODE_ENV must be one of: ${VALID_ENVIRONMENTS.join(', ')}.`);
  }

  private readPort(): number {
    const rawPort = this.readOptional('PORT');
    if (!rawPort) return DEFAULT_PORT;
    const port = Number(rawPort);
    if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
      throw new Error('PORT must be an integer between 1 and 65535.');
    }
    return port;
  }

  private readOptional(name: string): string | undefined {
    const value = this.env[name]?.trim();
    return value ? value : undefined;
  }

  private validateProductionSecrets(config: AppConfig): void {
    if (config.environment !== 'production') return;
    const missing = [
      ['DATABASE_URL', config.databaseUrl],
      ['JWT_SECRET', config.jwtSecret],
    ].filter(([, value]) => !value);

    if (missing.length > 0) {
      throw new Error(`Missing required production configuration: ${missing.map(([name]) => name).join(', ')}.`);
    }
  }
}
