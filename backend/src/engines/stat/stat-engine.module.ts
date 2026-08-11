import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StatService } from './stat.service';
import { STAT_MODIFIER_SOURCES } from './stat.tokens';

@Module({
  imports: [PrismaModule],
  providers: [{ provide: STAT_MODIFIER_SOURCES, useValue: [] }, StatService],
  exports: [StatService],
})
export class StatEngineModule {}
