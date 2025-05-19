import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EnergyUsage } from './schemas/energy-usage.schema';
import { EnergyUsageDto } from './dto/energy-usage.dto';

export interface EnergyUsageResult {
  date: string;
  meterId: string;
  consumption: number;
  startValue: number;
  endValue: number;
}

@Injectable()
export class EnergyUsageService {
  constructor(
    @InjectModel(EnergyUsage.name) private usageModel: Model<EnergyUsage>,
  ) {}

  async getEnergyUsage(dto: EnergyUsageDto): Promise<EnergyUsageResult[]> {
    const { start_date, end_date, meterIds, suffixes } = dto;
     const suffixArray = suffixes || [];

    const start = new Date(start_date);
    const end = new Date(end_date);
    end.setDate(end.getDate() + 1);

    const results: EnergyUsageResult[] = [];

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00.000+05:00`;
      const endOfDay = `${dateStr}T23:59:59.999+05:00`;

      for (let i = 0; i < meterIds.length; i++) {
        const meterId = meterIds[i];

        let suffix = '';
        if (meterId === 'U2') {
          suffix = 'Active_Energy_Total';

          // ❌ Skip U2 if correct suffix not in list
          if (!suffixArray.includes('Active_Energy_Total')) {
            continue;
          }
        } else {
          suffix = suffixArray[i] || suffixArray[0]; // fallback to first suffix
        }

        const key = `${meterId}_${suffix}`;

        const firstDoc = await this.usageModel.findOne(
          { timestamp: { $gte: startOfDay, $lte: endOfDay } },
          { [key]: 1, timestamp: 1 },
        ).sort({ timestamp: 1 }).exec();

        const lastDoc = await this.usageModel.findOne(
          { timestamp: { $gte: startOfDay, $lte: endOfDay } },
          { [key]: 1, timestamp: 1 },
        ).sort({ timestamp: -1 }).exec();

        if (
          firstDoc &&
          lastDoc &&
          firstDoc.get(key) !== undefined &&
          lastDoc.get(key) !== undefined
        ) {
          const startVal = firstDoc.get(key);
          const endVal = lastDoc.get(key);
          const consumption = endVal - startVal;

          results.push({
            date: dateStr,
            meterId,
            consumption,
            startValue: startVal,
            endValue: endVal,
          });
        }
      }
    }

    return results;
  }
}
