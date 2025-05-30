import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';
import { CompressorRuntime, CompressorRuntimeDocument } from './schema/compressor-runtime.schema';

@Injectable()
export class CompressorRuntimeService {
  constructor(
    @InjectModel(CompressorRuntime.name)
    private readonly compressorModel: Model<CompressorRuntimeDocument>,
  ) {}

  // Calculate seconds difference between two ISO timestamps in Asia/Karachi timezone
  private calculateSeconds(start?: string, end?: string): number {
    if (!start || !end) return 0;

    const startTime = moment.tz(start, 'Asia/Karachi').valueOf();
    const endTime = moment.tz(end, 'Asia/Karachi').valueOf();

    return Math.max(0, Math.floor((endTime - startTime) / 1000));
  }

  // Fetch compressor runtimes between startDate and endDate and sum runtimes per day per compressor
  async getDailyTotalSeconds(startDate: string, endDate: string) {
    // Keep timezone offset intact — do NOT use toISOString()
    const start = moment.tz(startDate, 'Asia/Karachi').startOf('day').format();
    const end = moment.tz(endDate, 'Asia/Karachi').endOf('day').format();

    // Find records with On_Time in the range
    const records = await this.compressorModel
      .find({
        $or: [
          { U5_On_Time: { $gte: start, $lte: end } },
          { U3_On_Time: { $gte: start, $lte: end } },
          { U4_On_Time: { $gte: start, $lte: end } },
        ],
      })
      .lean()
      .exec();

    const result: Record<string, { U5_total_seconds: number; U3_total_seconds: number; U4_total_seconds: number }> = {};

    for (const doc of records) {
      const compressors = [
        { key: 'U5', on: doc.U5_On_Time, off: doc.U5_Off_Time },
        { key: 'U3', on: doc.U3_On_Time, off: doc.U3_Off_Time },
        { key: 'U4', on: doc.U4_On_Time, off: doc.U4_Off_Time },
      ];

      for (const { key, on, off } of compressors) {
        if (!on || !off) continue;

        // Get date key in Asia/Karachi timezone (YYYY-MM-DD)
        const dateKey = moment.tz(on, 'Asia/Karachi').format('YYYY-MM-DD');

        if (!result[dateKey]) {
          result[dateKey] = { U5_total_seconds: 0, U3_total_seconds: 0, U4_total_seconds: 0 };
        }

        result[dateKey][`${key}_total_seconds`] += this.calculateSeconds(on, off);
      }
    }

    // Filter result by requested date range (inclusive)
    const filtered = Object.entries(result).filter(([date]) => {
      const dt = moment.tz(date, 'Asia/Karachi');
      return dt.isBetween(startDate, endDate, 'day', '[]'); // inclusive range
    });

    // Return formatted array
    return filtered.map(([date, totals]) => ({ date, ...totals }));
  }
}
