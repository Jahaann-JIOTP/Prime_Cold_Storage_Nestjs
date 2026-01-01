import { Module } from '@nestjs/common';
import { Compressor5Service } from './condensormotor.service';
import { Compressor5Controller } from './condensormotor.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Compressor5Schema } from './schemas/condensormotor.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'Compressor5', schema: Compressor5Schema, collection: 'prime_historical_data', }]),
    ],
  providers: [Compressor5Service],
  controllers: [Compressor5Controller]
})
export class Compressor5Module {}
