import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletService } from './wallet.service';

@Module({
  imports: [PrismaModule],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletEngineModule {}
