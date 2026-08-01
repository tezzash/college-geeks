import { ConfigService } from './config.service';
import { PrismaService } from '../database/prisma.service';

export class ConfigModule {
  readonly configService: ConfigService;

  constructor(prisma: PrismaService) {
    this.configService = new ConfigService(prisma);
  }
}
