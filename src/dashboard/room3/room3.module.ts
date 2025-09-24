import { Module } from '@nestjs/common';
import { Room3Service } from './room3.service';
import { Room3Controller } from './room3.controller';
import { room3Schema } from './schema/room3.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'room3',
        schema: room3Schema,
        collection: 'prime_historical_data',
      },
    ]),
  ],
  controllers: [Room3Controller],
  providers: [Room3Service],
})
export class Room3Module {}
