import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetEnergyCostDto } from './dto/get-energy-cost.dto';
import { EnergyCost } from './schemas/energy-cost.schema';
  import * as moment from 'moment-timezone';
@Injectable()
export class EnergyCostService {
  constructor(
    @InjectModel(EnergyCost.name) private costModel: Model<EnergyCost>,
  ) {}



async getConsumptionData(dto: GetEnergyCostDto) {
  const { start_date, start_time, end_date, end_time, meterIds, suffixes } = dto;

  const suffixArray = suffixes || [];

  // Default time values if not provided
  const startTime = start_time || '00:00:00.000';
  const endTime = end_time || '23:59:59.999';

  // Build full ISO timestamps in Asia/Karachi timezone
  const startOfRange = moment.tz(`${start_date} ${startTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi').toISOString(true);
  const endOfRange = moment.tz(`${end_date} ${endTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi').toISOString(true);

  const result: {
    meterId: string;
    startValue: number;
    endValue: number;
    consumption: number;
    startTimestamp: string;
    endTimestamp: string;
  }[] = [];

  for (let i = 0; i < meterIds.length; i++) {
    const meterId = meterIds[i];

    let suffix = '';
    if (meterId === 'U2') {
      suffix = 'Active_Energy_Total';

      // Skip if suffix array does NOT include 'Active_Energy_Total'
      if (!suffixArray.includes('Active_Energy_Total')) {
        continue;
      }
    } else {
      // For other meters, take suffix by index or fallback to first suffix
      suffix = suffixArray[i] || suffixArray[0];
    }

    const key = `${meterId}_${suffix}`;
    const projection = { [key]: 1, timestamp: 1 };

    // Find earliest record in time range
    const firstDoc = await this.costModel
      .findOne({ timestamp: { $gte: startOfRange, $lte: endOfRange } })
      .select(projection)
      .sort({ timestamp: 1 })
      .lean();

    // Find latest record in time range
    const lastDoc = await this.costModel
      .findOne({ timestamp: { $gte: startOfRange, $lte: endOfRange } })
      .select(projection)
      .sort({ timestamp: -1 })
      .lean();

    if (
      !firstDoc ||
      !lastDoc ||
      !firstDoc.hasOwnProperty(key) ||
      !lastDoc.hasOwnProperty(key)
    ) {
      continue;
    }

    const startValue = firstDoc[key];
    const endValue = lastDoc[key];
    const consumption = endValue - startValue;

    result.push({
      meterId,
      startValue,
      endValue,
      consumption,
      startTimestamp: firstDoc.timestamp,
      endTimestamp: lastDoc.timestamp,
    });
  }

  return result;
}

}
