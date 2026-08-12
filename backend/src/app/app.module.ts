import { AppConfig, ConfigService } from '../config';
import { HealthService } from '../health';

export class AppModule {
  readonly config: AppConfig;
  readonly healthService: HealthService;

  constructor(readonly configService = new ConfigService()) {
    this.config = this.configService.load();
    this.healthService = new HealthService(this.config);
  }
}
