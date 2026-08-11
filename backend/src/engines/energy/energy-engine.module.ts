import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigEngineModule } from '../config/config-engine.module';
import { EnergyService } from './energy.service';

@Module({
  imports: [PrismaModule, ConfigEngineModule],
  providers: [EnergyService],
  exports: [EnergyService],
})
export class EnergyEngineModule {}
