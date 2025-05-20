import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';
import { Bell, BellDocument } from './schemas/bell.schema';

@Injectable()
export class BellService {
  constructor(
    @InjectModel(Bell.name, 'prime_cold') 
    private readonly bellModel: Model<BellDocument>,
  ) {}

  async getAllBells() {
    const bells = await this.bellModel.find().sort({ Time: -1 }).limit(20);

    return {
      // bell_status: 'blue', // aap apni logic yahan daal sakte hain
      bells: bells.map((bell) => ({
        _id: bell._id,
        Source: bell.Source,
        Status: bell.Status,
        // Time: bell.Time ? moment(bell.Time).tz('Asia/Karachi').format('YYYY-MM-DD hh:mm:ss A') : null,
        // db_value: bell.db_value,
        // url_value: bell.url_value,
        // status1: bell.status1,
        // alarm_count: bell.alarm_count,
        current_time: bell.current_time ? moment(bell.current_time).tz('Asia/Karachi').format('YYYY-MM-DD hh:mm:ss A') : null,
        // end_time: bell.end_time ? moment(bell.end_time).tz('Asia/Karachi').format('YYYY-MM-DD hh:mm:ss A') : null,
      })),
    };
  }

async acknowledgeAllBells() {
  await this.bellModel.deleteMany({});  // saare documents delete kar de

  return { success: true, message: 'All bells acknowledged and removed successfully' };
}








  // POST /bell/acknowledge
  // async acknowledgeAllRecentAlarms() {
  //   // 1) Bell collection saaf karo (jis se bell blank ho jaye)
  //   await this.bellModel.deleteMany({});

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   // 2) Alarm collection mein aaj ke alarms ko acknowledge mark karo
  //   const updateResult = await this.alarmModel.updateMany(
  //     { current_time: { $gte: today }, acknowledged: { $ne: true } },
  //     { $set: { acknowledged: true } }
  //   );

  //   return {
  //     message: `Bell cleared. ${updateResult.modifiedCount} alarms acknowledged.`,
  //   };
  // }
}
