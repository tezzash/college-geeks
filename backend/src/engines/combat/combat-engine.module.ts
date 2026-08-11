import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EnergyEngineModule } from '../energy/energy-engine.module';
import { RuleEngineModule } from '../rule/rule-engine.module';
import { StatEngineModule } from '../stat/stat-engine.module';
import { WalletEngineModule } from '../wallet/wallet-engine.module';
import { CombatService } from './combat.service';

@Module({
  imports: [PrismaModule, EnergyEngineModule, RuleEngineModule, StatEngineModule, WalletEngineModule],
  providers: [CombatService],
  exports: [CombatService],
})
export class CombatEngineModule {}
