import { Module } from '@nestjs/common';
import { LogsDataController } from './logs_data.controller';
import { LogsDataService } from './logs_data.service';

@Module({
  controllers: [LogsDataController],
  providers: [LogsDataService]
})
export class LogsDataModule {}
