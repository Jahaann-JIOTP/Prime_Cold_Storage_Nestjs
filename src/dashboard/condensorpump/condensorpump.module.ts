import { Module } from '@nestjs/common';
import { Compressor4Service } from './condensorpump.service';
import { Compressor4Controller } from './condensorpump.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Compressor4Schema } from './schemas/condensorpump.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'Compressor4', schema: Compressor4Schema, collection: 'prime_historical_data', }]),
    ],
  providers: [Compressor4Service],
  controllers: [Compressor4Controller]
})
export class Compressor4Module {}
