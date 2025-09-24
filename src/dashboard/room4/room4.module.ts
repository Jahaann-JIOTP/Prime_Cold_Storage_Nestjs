import { Module } from '@nestjs/common';
import { Room4Service } from './room4.service';
import { Room4Controller } from './room4.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { room4Schema } from './schema/room4.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'room4',
        schema: room4Schema,
        collection: 'prime_historical_data',
      },
    ]),
  ],
  controllers: [Room4Controller],
  providers: [Room4Service],
})
export class Room4Module {}
