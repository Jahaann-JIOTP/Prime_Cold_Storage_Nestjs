import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetEnergyCostDto } from './dto/get-energy-cost.dto';
import { EnergyCost } from './schemas/energy-cost.schema';

@Injectable()
export class EnergyCostService {
  constructor(
    @InjectModel(EnergyCost.name) private costModel: Model<EnergyCost>,
  ) {}

  async getConsumptionData(dto: GetEnergyCostDto) {
    const { start_date, end_date, meterIds, suffixes } = dto;

 const suffixArray = suffixes || [];



    const startOfRange = `${start_date}T00:00:00.000+05:00`;
    const endOfRange = `${end_date}T23:59:59.999+05:00`;

    const result: {
      meterId: string;
      startValue: number;
      endValue: number;
      consumption: number;
    }[] = [];

    for (let i = 0; i < meterIds.length; i++) {
      const meterId = meterIds[i];

      // 📌 Step 1: Determine the suffix
      let suffix = '';
      if (meterId === 'U2') {
        suffix = 'Active_Energy_Total';

        // ❌ If suffix list does NOT include required suffix for U2, skip it
        if (!suffixArray.includes('Active_Energy_Total')) {
          continue;
        }
      } else {
        // All other meters use given suffix (by position or default to first)
        suffix = suffixArray[i] || suffixArray[0];
      }

      const key = `${meterId}_${suffix}`;
      const projection = { [key]: 1, timestamp: 1 };

      // 📌 Step 2: Get first document in time range
      const firstDoc = await this.costModel
        .findOne({ timestamp: { $gte: startOfRange, $lte: endOfRange } })
        .select(projection)
        .sort({ timestamp: 1 })
        .lean();

      // 📌 Step 3: Get last document in time range
      const lastDoc = await this.costModel
        .findOne({ timestamp: { $gte: startOfRange, $lte: endOfRange } })
        .select(projection)
        .sort({ timestamp: -1 })
        .lean();

      // 📌 Step 4: Skip if data is missing
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
      });
    }

    return result;
  }
}
