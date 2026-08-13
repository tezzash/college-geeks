import { DatabasePlayerService, PrismaService } from '../database';
import { AppConfig, ConfigService } from '../config';
import { HealthService } from '../health';

export class AppModule {
  readonly config: AppConfig;
  readonly healthService: HealthService;
  readonly prisma: PrismaService;
  readonly databasePlayerService: DatabasePlayerService;

  constructor(readonly configService = new ConfigService()) {
    this.config = this.configService.load();
    this.healthService = new HealthService(this.config);
    this.prisma = new PrismaService();
    this.databasePlayerService = new DatabasePlayerService(this.prisma);
  }
}
