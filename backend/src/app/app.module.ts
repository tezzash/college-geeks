import { DatabaseAlliesService, DatabaseBattleService, DatabaseJobsService, DatabasePlayerService, DatabaseTowerService, PrismaService } from '../database';
import { AppConfig, ConfigService } from '../config';
import { CombatService } from '../combat';
import { GameConfigService } from '../game-config';
import { HealthService } from '../health';
import { PlayerService } from '../player';

export class AppModule {
  readonly config: AppConfig;
  readonly healthService: HealthService;
  readonly playerService: PlayerService;
  readonly prisma: PrismaService;
  readonly databasePlayerService: DatabasePlayerService;
  readonly databaseJobsService: DatabaseJobsService;
  readonly databaseTowerService: DatabaseTowerService;
  readonly databaseAlliesService: DatabaseAlliesService;
  readonly databaseBattleService: DatabaseBattleService;

  constructor(readonly configService = new ConfigService()) {
    this.config = this.configService.load();
    this.healthService = new HealthService(this.config);
    this.playerService = new PlayerService();
    this.prisma = new PrismaService();
    this.databasePlayerService = new DatabasePlayerService(this.prisma);
    this.databaseJobsService = new DatabaseJobsService(this.prisma);
    this.databaseTowerService = new DatabaseTowerService(this.prisma);
    this.databaseAlliesService = new DatabaseAlliesService(this.prisma);

    const gameConfig = new GameConfigService().getConfig();
    const combat = new CombatService(gameConfig);
    this.databaseBattleService = new DatabaseBattleService(
      this.prisma,
      combat,
      gameConfig.pvpEnergyCost,
      gameConfig.stealRate,
    );
  }
}
