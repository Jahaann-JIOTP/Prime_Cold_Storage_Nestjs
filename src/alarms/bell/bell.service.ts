// src/bell/bell.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bell, BellDocument } from './schemas/bell.schema';
import { Alarm, AlarmDocument } from './schemas/alarm.schema'; // ✅ Import alarm schema
import * as moment from 'moment-timezone';

@Injectable()
export class BellService {
  constructor(
    @InjectModel(Bell.name, 'prime_cold') private bellModel: Model<BellDocument>,
    @InjectModel(Alarm.name, 'prime_cold') private alarmModel: Model<AlarmDocument>,
  ) {}
  
  async fetchBellData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    // ✅ Alarms fetch karo alarmModel se, bellModel se nahi
    const latestAlarms = await this.alarmModel.find({
      Time: { $gte: today },
    }).sort({ Time: -1 }).limit(5);
  
    if (!latestAlarms.length) {
      console.log('⚡ No alarms found for today.');
      return { bell_status: 'blue', alarms: [] };
    }
  
    console.log('🚀 ~ Today\'s Alarms fetched:', latestAlarms);
  
    const bellData = latestAlarms.map((alarm) => ({
      source: alarm.Source,
      status: alarm.status1,
      // value: alarm.Value,
      // db_value: alarm.db_value,
      // url_value: alarm.url_value,
      // alarm_count: alarm.alarm_count,
      start_time:  alarm.current_time
      ? moment(alarm.current_time).tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss')
      : null,
      // end_time: alarm.end_time
      // ? moment(alarm.end_time).tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss')
      // : null,
    }));
  
    await this.bellModel.deleteMany({});
    await this.bellModel.insertMany(bellData);
  
    const new_alarm_triggered = bellData.some((bell) =>
      (bell.status || '').includes('Exceeded')
    );
  
    const bell_status = new_alarm_triggered ? 'red' : 'blue';
  
    return {
      // bell_status,
      alarms: bellData,
    };
  }
}
