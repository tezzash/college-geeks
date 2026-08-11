import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigEngineModule } from '../config/config-engine.module';
import { EnergyEngineModule } from '../energy/energy-engine.module';
import { StatEngineModule } from '../stat/stat-engine.module';
import { WalletEngineModule } from '../wallet/wallet-engine.module';
import { RuleService } from './rule.service';

@Module({
  imports: [PrismaModule, ConfigEngineModule, EnergyEngineModule, StatEngineModule, WalletEngineModule],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleEngineModule {}
