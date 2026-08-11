import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { envValidationSchema } from './config/env.validation';
import { ConfigEngineModule } from './engines/config/config-engine.module';
import { WalletEngineModule } from './engines/wallet/wallet-engine.module';
import { EnergyEngineModule } from './engines/energy/energy-engine.module';
import { StatEngineModule } from './engines/stat/stat-engine.module';
import { RuleEngineModule } from './engines/rule/rule-engine.module';
import { CombatEngineModule } from './engines/combat/combat-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    ConfigEngineModule,
    WalletEngineModule,
    EnergyEngineModule,
    StatEngineModule,
    RuleEngineModule,
    CombatEngineModule,
  ],
})
export class AppModule {}
