import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';
import { Bell, BellDocument } from './schemas/bell.schema';
import { Alarm, AlarmDocument } from './schemas/alarm.schema';

@Injectable()
export class BellService {
  private readonly logger = new Logger(BellService.name);

  constructor(
    @InjectModel(Bell.name, 'prime_cold') private bellModel: Model<BellDocument>,
    @InjectModel(Alarm.name, 'prime_cold') private alarmModel: Model<AlarmDocument>,
  ) {}

  // GET /bell
  async fetchBellData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unacknowledged alarms from today
    const latestAlarms = await this.alarmModel.find({
      current_time: { $gte: today },
      acknowledged: { $ne: true }, // only unacknowledged
    }).sort({ current_time: -1 }).limit(5);

    if (!latestAlarms.length) {
      this.logger.log('No unacknowledged alarms found for today.');
      return { bell_status: 'blue', alarms: [] };
    }

    const bellData = latestAlarms.map((alarm) => ({
      source: alarm.Source,
      status: alarm.status1,
      start_time: alarm.current_time
        ? moment(alarm.current_time).tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss')
        : null,
    }));

    // Clear bell collection and insert new data
    await this.bellModel.deleteMany({});
    await this.bellModel.insertMany(bellData);

    // Determine bell status: red if any alarm status includes 'Exceeded'
    const bell_status = bellData.some(b => (b.status || '').includes('Exceeded')) ? 'red' : 'blue';

    return {
      bell_status,
      alarms: bellData,
    };
  }

  // POST /bell/acknowledge
  async acknowledgeAllRecentAlarms() {
    // Delete all bell records
    const deleteResult = await this.bellModel.deleteMany({});

    // Mark today's unacknowledged alarms as acknowledged
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateResult = await this.alarmModel.updateMany(
      { current_time: { $gte: today }, acknowledged: { $ne: true } },
      { $set: { acknowledged: true } }
    );

    return {
      message: `${deleteResult.deletedCount} bell records removed. ${updateResult.modifiedCount} alarms acknowledged.`,
    };
  }
}
