export interface AppConfig {
  environment: 'development' | 'test' | 'production';
  port: number;
  databaseUrl?: string;
  jwtSecret?: string;
  corsOrigin: string;
}
