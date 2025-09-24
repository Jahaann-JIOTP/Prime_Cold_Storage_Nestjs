import { Module } from '@nestjs/common';
import { Room6Service } from './room6.service';
import { Room6Controller } from './room6.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { room6Schema } from './schema/room6.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'room6',
        schema: room6Schema,
        collection: 'prime_historical_data',
      },
    ]),
  ],
  controllers: [Room6Controller],
  providers: [Room6Service],
})
export class Room6Module {}
