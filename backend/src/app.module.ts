import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { envValidationSchema } from './config/env.validation';
import { AlliesModule } from './modules/allies/allies.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { PlayerModule } from './modules/player/player.module';
import { PvpModule } from './modules/pvp/pvp.module';
import { TowerModule } from './modules/tower/tower.module';
import { CombatEngineModule } from './engines/combat/combat-engine.module';
import { ConfigEngineModule } from './engines/config/config-engine.module';
import { EnergyEngineModule } from './engines/energy/energy-engine.module';
import { RuleEngineModule } from './engines/rule/rule-engine.module';
import { StatEngineModule } from './engines/stat/stat-engine.module';
import { WalletEngineModule } from './engines/wallet/wallet-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    StatEngineModule,
    WalletEngineModule,
    EnergyEngineModule,
    RuleEngineModule,
    CombatEngineModule,
    ConfigEngineModule,
    AuthModule,
    PlayerModule,
    TowerModule,
    AlliesModule,
    JobsModule,
    PvpModule,
    LeaderboardModule,
    ChatModule,
  ],
})
export class AppModule {}
