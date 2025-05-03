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
    const meterIds = [ "G2_U20", "U_27", "U_24", "U_25", "U_17", "U_5", "U_23", "U_15", "U_2", "U_11", "U_10", "U_7", "U_6",
        "U_12", "U_4", "U_20", "U_9", "U_19", "U_16", "U_18", "U_8", "U_22", "U_3", "U_13", "U_21", "U_14",
        "G1_U2", "G1_U3", "G1_U4", "G1_U5", "G1_U6", "G1_U7", "G1_U8", "G1_U10", "G1_U11", "G1_U12", "G1_U13",
        "G1_U14", "G1_U15", "G1_U16", "G1_U17", "G1_U18", "G1_U19", "G2_U2", "G2_U3", "G2_U4", "G2_U7", "G2_U8", 
        "G2_U9", "G2_U10", "G2_U11", "G2_U12", "G2_U13", "G2_U14", "G2_U15", "G2_U16", "G2_U17", "G2_U18", "G2_U5", 
        "G2_U19", "G2_U6"];
    const suffixes: string[] = ['ACTIVE_ENERGY_IMPORT_KWH'];


    const solarKeys = ['G2_U20_ACTIVE_ENERGY_IMPORT_KWH', 'U_27_ACTIVE_ENERGY_IMPORT_KWH'];
    const transformerKeys = ['U_24_ACTIVE_ENERGY_IMPORT_KWH', 'U_25_ACTIVE_ENERGY_IMPORT_KWH'];
    const gensetKeys = ['G1_U16_ACTIVE_ENERGY_IMPORT_KWH', 'G1_U17_ACTIVE_ENERGY_IMPORT_KWH', 'G1_U18_ACTIVE_ENERGY_IMPORT_KWH', 'G1_U19_ACTIVE_ENERGY_IMPORT_KWH'];

    const ballMill4Key = 'U_2_ACTIVE_ENERGY_IMPORT_KWH';
    const mosqueKey = 'U_3_ACTIVE_ENERGY_IMPORT_KWH';
    const glazeLine2Key = 'U_4_ACTIVE_ENERGY_IMPORT_KWH';

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
    let transformer = sumGroup(transformerKeys) * 10;
    let genset = sumGroup(gensetKeys);
    let totalConsumption = solar + transformer + genset;

    let ballMill4 = consumption[ballMill4Key] || 0;
    let mosque = consumption[mosqueKey] || 0;
    let glazeLine2 = consumption[glazeLine2Key] || 0;

    let production = ballMill4 + mosque + glazeLine2;
    let unaccountable = totalConsumption - production;

    return {
      total_consumption: {
        Total_Consumption: totalConsumption.toFixed(5),
        // Ball_Mill_4: ballMill4.toFixed(5),
        // Mosque: mosque.toFixed(5),
        // Glaze_Line2Consumption: glazeLine2.toFixed(5),
        Unaccountable_Energy: unaccountable.toFixed(5),
        totalproduction: production.toFixed(5),
      },
    };
  }
}
