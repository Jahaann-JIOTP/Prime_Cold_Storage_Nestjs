import { Module } from '@nestjs/common';
import { Room1Service } from './room1.service';
import { Room1Controller } from './room1.controller';
import { room1Schema } from './schema/room1.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'room1',
        schema: room1Schema,
        collection: 'prime_historical_data',
      },
    ]),
  ],
  controllers: [Room1Controller],
  providers: [Room1Service],
})
export class Room1Module {}
