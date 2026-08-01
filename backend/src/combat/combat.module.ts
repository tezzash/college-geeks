import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EnergyService } from '../energy/energy.service';
import { NoopDomainEventBus } from '../events/domain-event-bus';
import { RuleService } from '../rules/rule.service';
import { StatService } from '../stats/stat.service';
import { WalletService } from '../wallet/wallet.service';
import { CombatService, DOMAIN_EVENT_BUS } from './combat.service';

@Module({
  providers: [
    CombatService,
    PrismaService,
    WalletService,
    StatService,
    RuleService,
    EnergyService,
    { provide: DOMAIN_EVENT_BUS, useClass: NoopDomainEventBus },
  ],
  exports: [CombatService],
})
export class CombatModule {}
