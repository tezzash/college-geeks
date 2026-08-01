import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StatService } from './stat.service';
import { STAT_MODIFIER_SOURCES } from './stat.tokens';

@Module({
  providers: [PrismaService, { provide: STAT_MODIFIER_SOURCES, useValue: [] }, StatService],
  exports: [StatService],
})
export class StatModule {}
