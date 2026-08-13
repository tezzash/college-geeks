import { AppConfig, ConfigService } from '../config';
import { HealthService } from '../health';
import { PlayerService } from '../player';

export class AppModule {
  readonly config: AppConfig;
  readonly healthService: HealthService;
  readonly playerService: PlayerService;

  constructor(readonly configService = new ConfigService()) {
    this.config = this.configService.load();
    this.healthService = new HealthService(this.config);
    this.playerService = new PlayerService();
  }
}
