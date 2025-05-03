// bell/bell.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bell, BellSchema } from './schemas/bell.schema';
import { Alarm, AlarmSchema } from './schemas/alarm.schema';
import { BellController } from './bell.controller';
import { BellService } from './bell.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Alarm.name, schema: AlarmSchema },
        { name: Bell.name, schema: BellSchema },
      ],
      'Prime_Cold_Alarms', // <- Connection name
    ),
  ],
  controllers: [BellController],
  providers: [BellService],
})
export class BellModule {}
