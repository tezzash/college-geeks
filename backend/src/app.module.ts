import { Module } from '@nestjs/common';
import { GameConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [GameConfigModule, DatabaseModule, WalletModule],
})
export class AppModule {}
