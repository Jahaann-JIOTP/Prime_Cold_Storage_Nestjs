import { Module } from '@nestjs/common';
import { Room2Service } from './room2.service';
import { Room2Controller } from './room2.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { room2Schema } from './schema/room2.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'room2',
        schema: room2Schema,
        collection: 'prime_historical_data',
      },
    ]),
  ],
  controllers: [Room2Controller],
  providers: [Room2Service],
})
export class Room2Module {}
