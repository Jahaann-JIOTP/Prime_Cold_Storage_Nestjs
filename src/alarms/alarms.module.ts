import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlarmsController } from './alarms.controller';
import { AlarmsService } from './alarms.service';
import { Alarm, AlarmSchema } from './schemas/alarm.schema';
import { Meter, MeterSchema } from './schemas/meter.schema';
import { RecentAlarm, RecentAlarmSchema } from './schemas/recent-alarm.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Alarm.name, schema: AlarmSchema }],
      'prime_cold',
    ),
    MongooseModule.forFeature(
      [{ name: Meter.name, schema: MeterSchema }],
      'prime_cold',
    ),
    MongooseModule.forFeature(
      [{ name: RecentAlarm.name, schema: RecentAlarmSchema }],
      'prime_cold',
    ),
  ],
  controllers: [AlarmsController],
  providers: [AlarmsService],
})
export class AlarmsModule {}
