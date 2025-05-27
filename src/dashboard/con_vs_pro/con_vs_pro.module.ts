import { Module } from '@nestjs/common';
import { ConVsProService } from './con_vs_pro.service';
import { ConVsProController } from './con_vs_pro.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PrimeHistoricalDataSchema } from './schemas/prime-historical-data.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'con_vs_pro', schema: PrimeHistoricalDataSchema, collection: 'prime_historical_data', }]),
    ],
  controllers: [ConVsProController],
  providers: [ConVsProService],
})
export class ConVsProModule {}