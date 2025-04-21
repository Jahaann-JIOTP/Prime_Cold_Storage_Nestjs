// src/energy-cost/energy-cost.service.ts

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
    const suffixArray = suffixes ? suffixes.split(',') : [];

    const startOfRange = `${start_date}T00:00:00.000+05:00`;
    const endOfRange = `${end_date}T23:59:59.999+05:00`;

    const result: {
      meterId: string;
      startValue: number;
      endValue: number;
      consumption: number;
    }[] = [];

    for (const meterId of meterIds) {
      const suffix = suffixArray[0]; // Simplified
      const key = `${meterId}_${suffix}`;
      const projection = { [key]: 1, timestamp: 1 };

      const firstDoc = await this.costModel
        .findOne({ timestamp: { $gte: startOfRange, $lte: endOfRange } })
        .select(projection)
        .sort({ timestamp: 1 })
        .lean();

      const lastDoc = await this.costModel
        .findOne({ timestamp: { $gte: startOfRange, $lte: endOfRange } })
        .select(projection)
        .sort({ timestamp: -1 })
        .lean();

      if (firstDoc && lastDoc) {
        const startValue = firstDoc[key] || 0;
        const endValue = lastDoc[key] || 0;
        const consumption = endValue - startValue;

        result.push({
          meterId,
          startValue,
          endValue,
          consumption,
        });
      }
    }

    return result;
  }
}
