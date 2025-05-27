import { Module } from '@nestjs/common';
import { Compressor2Service } from './compressor2.service';
import { Compressor2Controller } from './compressor2.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Compressor2Schema } from './schemas/compressor2.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'Compressor2', schema: Compressor2Schema, collection: 'prime_historical_data', }]),
    ],
  providers: [Compressor2Service],
  controllers: [Compressor2Controller]
})
export class Compressor2Module {}
