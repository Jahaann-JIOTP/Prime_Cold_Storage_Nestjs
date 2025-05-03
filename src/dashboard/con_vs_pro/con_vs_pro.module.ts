import { Module } from '@nestjs/common';
import { ConVsProService } from './con_vs_pro.service';
import { ConVsProController } from './con_vs_pro.controller';

@Module({
  controllers: [ConVsProController],
  providers: [ConVsProService],
})
export class ConVsProModule {}
