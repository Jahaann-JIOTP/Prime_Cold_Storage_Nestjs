import { Module } from '@nestjs/common';
import { Room7Service } from './room7.service';
import { Room7Controller } from './room7.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { room7Schema } from './schema/room7.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'room7',
        schema: room7Schema,
        collection: 'prime_historical_data',
      },
    ]),
  ],
  controllers: [Room7Controller],
  providers: [Room7Service],
})
export class Room7Module {}
