import { Module } from '@nestjs/common';
import { Room5Service } from './room5.service';
import { Room5Controller } from './room5.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { room5Schema } from './schema/room5.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'room5',
        schema: room5Schema,
        collection: 'prime_historical_data',
      },
    ]),
  ],
  controllers: [Room5Controller],
  providers: [Room5Service],
})
export class Room5Module {}
