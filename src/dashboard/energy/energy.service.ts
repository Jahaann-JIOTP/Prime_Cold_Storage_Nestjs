// src/energy/energy.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Energy, EnergyDocument } from './schemas/energy.schema';

@Injectable()
export class EnergyService {
  constructor(
    @InjectModel(Energy.name) private energyModel: Model<EnergyDocument>,
  ) {}

  async getConsumption(start: string, end: string) {
    const meterIds = [ "U1", "U2", "U3", "U4", "U5"];
    const suffixes: string[] = ['Active_Energy_Total_Consumed'];


    const solarKeys = ['U2_Active_Energy_Total_Consumed'];
    const WapdaKeys = ['U1_Active_Energy_Total_Consumed'];
    

       const Compressor1Key = 'U3_Active_Energy_Total_Consumed';
    const Compressor2Key = 'U4_Active_Energy_Total_Consumed';
    const Compressor3Key = 'U5_Active_Energy_Total_Consumed';

    const matchStage = {
      timestamp: {
        $gte: `${start}T00:00:00.000+05:00`,
        $lte: `${end}T23:59:59.999+05:00`,
      },
    };

    const projection: { [key: string]: number } = { timestamp: 1 };

    for (const id of meterIds) {
        for (const suffix of suffixes) {
          projection[`${id}_${suffix}`] = 1;
        }
      }
      
    

    const result = await this.energyModel.aggregate([
      { $match: matchStage },
      { $project: projection },
      { $sort: { timestamp: 1 } },
    ]);

    const firstValues = {};
    const lastValues = {};

    for (const doc of result) {
        meterIds.forEach(id => {
          suffixes.forEach(suffix => {
            const key = `${id}_${suffix}`;
            if (doc[key] !== undefined) {
              if (!firstValues[key]) firstValues[key] = doc[key];
              lastValues[key] = doc[key];
            }
          });
        });
      }
      

    const consumption = {};
    Object.keys(firstValues).forEach(key => {
      consumption[key] = lastValues[key] - firstValues[key];
    });

    const sumGroup = (keys: string[]) =>
      keys.reduce((sum, key) => sum + (consumption[key] || 0), 0);

    let solar = sumGroup(solarKeys);
    let Wapda = sumGroup(WapdaKeys);
   
    let totalConsumption = solar + Wapda;

    let Compressor1 = consumption[Compressor1Key] || 0;
    let Compressor2 = consumption[Compressor2Key] || 0;
    let Compressor3 = consumption[Compressor3Key] || 0;

    let production = Compressor1 + Compressor2 + Compressor3;
    let unaccountable = totalConsumption - production;

    return {
  total_consumption: {
    Total_Consumption: totalConsumption.toFixed(5),
    Compressor1: Compressor1.toFixed(5),
    Compressor2: Compressor2.toFixed(5),
    Compressor3: Compressor3.toFixed(5),
    Unaccountable_Energy: unaccountable.toFixed(5),
    Sum_of_compressors: production.toFixed(5),
  },
};

  }
}
