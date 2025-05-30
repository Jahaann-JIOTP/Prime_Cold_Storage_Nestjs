import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone'; // <-- updated import
import { CompressorRuntime, CompressorRuntimeDocument } from './schema/compressor-runtime.schema';

moment.tz.setDefault('Asia/Karachi'); // <-- set default timezone

@Injectable()
export class CompressorRuntimeService {
  constructor(
    @InjectModel(CompressorRuntime.name)
    private readonly compressorModel: Model<CompressorRuntimeDocument>,
  ) {}

  private calculateSeconds(start?: string, end?: string): number {
    if (!start || !end) return 0;
    const startTime = moment.tz(start, 'Asia/Karachi').toDate().getTime();
    const endTime = moment.tz(end, 'Asia/Karachi').toDate().getTime();
    return Math.max(0, Math.floor((endTime - startTime) / 1000));
  }

  async getDailyTotalSeconds(startDate: string, endDate: string) {
    const start = moment.tz(startDate, 'Asia/Karachi').startOf('day').toDate();
    const end = moment.tz(endDate, 'Asia/Karachi').endOf('day').toDate();

    const records = await this.compressorModel.find({
      $or: [
        { U5_On_Time: { $gte: start.toISOString(), $lte: end.toISOString() } },
        { U3_On_Time: { $gte: start.toISOString(), $lte: end.toISOString() } },
        { U4_On_Time: { $gte: start.toISOString(), $lte: end.toISOString() } },
      ],
    }).exec();

    const result: Record<string, { U5TotalSeconds: number; U3TotalSeconds: number; U4TotalSeconds: number }> = {};

    for (const doc of records) {
      const timePairs = [
        { type: 'U5', on: doc.U5_On_Time, off: doc.U5_Off_Time },
        { type: 'U3', on: doc.U3_On_Time, off: doc.U3_Off_Time },
        { type: 'U4', on: doc.U4_On_Time, off: doc.U4_Off_Time },
      ];

      for (const { type, on, off } of timePairs) {
        if (!on || !off) continue;

        const dateKey = moment.tz(on, 'Asia/Karachi').format('YYYY-MM-DD');

        if (!result[dateKey]) {
          result[dateKey] = { U5TotalSeconds: 0, U3TotalSeconds: 0, U4TotalSeconds: 0 };
        }

        const seconds = this.calculateSeconds(on, off);
        if (type === 'U5') result[dateKey].U5TotalSeconds += seconds;
        if (type === 'U3') result[dateKey].U3TotalSeconds += seconds;
        if (type === 'U4') result[dateKey].U4TotalSeconds += seconds;
      }
    }

    return Object.entries(result).map(([date, totals]) => ({
      date,
      U5_total_seconds: totals.U5TotalSeconds,
      U3_total_seconds: totals.U3TotalSeconds,
      U4_total_seconds: totals.U4TotalSeconds,
    }));
  }
}
