import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Compressor1Service } from './compressor1.service';
import { Compressor1Controller } from './compressor1.controller';
import { Compressor1Schema } from './schemas/compressor1.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Compressor1', schema: Compressor1Schema, collection: 'prime_historical_data', }]),
  ],
  providers: [Compressor1Service],
  controllers: [Compressor1Controller],
})
export class Compressor1Module {}
