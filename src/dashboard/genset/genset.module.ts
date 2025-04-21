import { Module } from '@nestjs/common';
import { GensetController } from './genset.controller';
import { GensetService } from './genset.service';

@Module({
  controllers: [GensetController],
  providers: [GensetService]
})
export class GensetModule {}
