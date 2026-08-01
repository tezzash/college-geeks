import { Module } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { EnergyService } from '../energy/energy.service';
import { PrismaService } from '../database/prisma.service';
import { StatService } from '../stats/stat.service';
import { WalletService } from '../wallet/wallet.service';
import { RuleService } from './rule.service';

@Module({ providers: [RuleService, ConfigService, WalletService, EnergyService, StatService, PrismaService], exports: [RuleService] })
export class RuleModule {}
