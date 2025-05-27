import { Module } from '@nestjs/common';
import { Compressor3Service } from './compressor3.service';
import { Compressor3Controller } from './compressor3.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Compressor2Schema } from './schemas/compressor2.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'Compressor3', schema: Compressor2Schema, collection: 'prime_historical_data', }]),
    ],
  providers: [Compressor3Service],
  controllers: [Compressor3Controller]
})
export class Compressor3Module {}
