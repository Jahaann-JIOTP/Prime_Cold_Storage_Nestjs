import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Bell, BellSchema } from './schemas/bell.schema';
import { BellService } from './bell.service';
import { BellController } from './bell.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bell.name, schema: BellSchema }], 'prime_cold'),
  ],
  providers: [BellService],
  controllers: [BellController],
})
export class BellModule {}
