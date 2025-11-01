import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EnergyUsage } from './schemas/energy-usage.schema';
import { EnergyUsageDto } from './dto/energy-usage.dto';
import * as moment from 'moment-timezone';

@Injectable()
export class EnergyUsageService {
  constructor(
    @InjectModel(EnergyUsage.name) private usageModel: Model<EnergyUsage>,
  ) {}

  async getEnergyUsage(dto: EnergyUsageDto): Promise<any[]> {
    const { start_date, end_date, start_time, end_time, meterIds, suffixes } = dto;
    const suffixArray = suffixes || [];

      let defaultStartTime = start_time || '00:00:00.000';
      let defaultEndTime = end_time || '23:59:59.999';
    const results: any[] = [];

    const current = moment.tz(`${start_date} ${defaultStartTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');
    const endDateMoment = moment.tz(`${end_date} ${defaultEndTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');

    while (current.isSameOrBefore(endDateMoment, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');

      const startOfDay = moment.tz(`${dateStr} ${defaultStartTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi').toISOString(true);
      const endOfDay = moment.tz(`${dateStr} ${defaultEndTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi').toISOString(true);

      for (let i = 0; i < meterIds.length; i++) {
        const meterId = meterIds[i];

        let suffix = '';
        if (meterId === 'U2') {
          suffix = 'Active_Energy_Total';
          if (!suffixArray.includes('Active_Energy_Total')) {
            continue;
          }
        } else {
          suffix = suffixArray[i] || suffixArray[0];
        }

        const key = `${meterId}_${suffix}`;
        const projection = { [key]: 1, timestamp: 1 };

        const firstDoc = await this.usageModel.findOne(
          { timestamp: { $gte: startOfDay, $lte: endOfDay } },
          projection,
        ).sort({ timestamp: 1 }).lean();

        const lastDoc = await this.usageModel.findOne(
          { timestamp: { $gte: startOfDay, $lte: endOfDay } },
          projection,
        ).sort({ timestamp: -1 }).lean();

        if (
          firstDoc &&
          lastDoc &&
          firstDoc.hasOwnProperty(key) &&
          lastDoc.hasOwnProperty(key)
        ) {
          const startVal = firstDoc[key];
          const endVal = lastDoc[key];
          const consumption = endVal - startVal;

          results.push({
            // date: dateStr,
            meterId,
            consumption,
            startValue: startVal,
            endValue: endVal,
            startTimestamp: firstDoc.timestamp,
            endTimestamp: lastDoc.timestamp,
          });
        }
      }

      // Move to next day
      current.add(1, 'day');
    }

    return results;
    }
}
