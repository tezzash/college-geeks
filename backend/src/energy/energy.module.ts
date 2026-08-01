import { Module } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../database/prisma.service';
import { EnergyService } from './energy.service';

@Module({
  providers: [EnergyService, PrismaService, ConfigService],
  exports: [EnergyService],
})
export class EnergyModule {}
