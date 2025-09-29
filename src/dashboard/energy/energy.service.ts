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
    const meterIds = [
      'U1',
      'U2',
      'U3',
      'U4',
      'U5',
      'U6',
      'U7',
      'U8',
      'U9',
      'U10',
      'U11',
      'U12',
    ];
    const suffixes: string[] = [
      'Active_Energy_Total_Consumed',
      'Active_Energy_Total',
      'Active_Energy_Total_Supplied',
    ];

    // Energy Sources
    const solarKeys = ['U2_Active_Energy_Total_Consumed'];
    const WapdaKeys = ['U1_Active_Energy_Total'];
    const Wapda2Keys = ['U1_Active_Energy_Total_Supplied'];

    // Compressors
    const Compressor1Key = 'U3_Active_Energy_Total_Consumed';
    const Compressor2Key = 'U4_Active_Energy_Total_Consumed';
    const Compressor3Key = 'U5_Active_Energy_Total_Consumed';

    // Rooms mapping
    const RoomKeys = {
      Room1: 'U7_Active_Energy_Total_Consumed',
      Room2: 'U8_Active_Energy_Total_Consumed',
      Room3: 'U9_Active_Energy_Total_Consumed',
      Room4: 'U10_Active_Energy_Total_Consumed',
      Room5: 'U11_Active_Energy_Total_Consumed',
      Room6: 'U12_Active_Energy_Total_Consumed',
      Room7: 'U6_Active_Energy_Total_Consumed',
    };

    // Query
    const matchStage = {
      timestamp: {
        $gte: `${start}T00:00:00.000+05:00`,
        $lte: `${end}T23:59:59.999+05:00`,
      },
    };

    // Projection
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

    // First & Last values
    const firstValues = {};
    const lastValues = {};

    for (const doc of result) {
      meterIds.forEach((id) => {
        suffixes.forEach((suffix) => {
          const key = `${id}_${suffix}`;
          if (doc[key] !== undefined) {
            if (!firstValues[key]) firstValues[key] = doc[key];
            lastValues[key] = doc[key];
          }
        });
      });
    }

    // Consumption
    const consumption = {};
    Object.keys(firstValues).forEach((key) => {
      consumption[key] = lastValues[key] - firstValues[key];
    });

    const sumGroup = (keys: string[]) =>
      keys.reduce((sum, key) => sum + (consumption[key] || 0), 0);

    const solar = sumGroup(solarKeys);
    const Wapda = sumGroup(WapdaKeys);
    const Wapda2 = sumGroup(Wapda2Keys);

    const totalGeneration = solar + Wapda;

    // Compressors
    const Compressor1 = consumption[Compressor1Key] || 0;
    const Compressor2 = consumption[Compressor2Key] || 0;
    const Compressor3 = consumption[Compressor3Key] || 0;
    const production = Compressor1 + Compressor2 + Compressor3;

    // Rooms
    const roomConsumption: Record<string, number> = {};
    Object.keys(RoomKeys).forEach((room) => {
      roomConsumption[room] = consumption[RoomKeys[room]] || 0;
    });
    const totalRooms = Object.values(roomConsumption).reduce(
      (a, b) => a + b,
      0,
    );

    // ✅ Total Consumption (Compressors + Rooms)
    const totalConsumption = production + totalRooms;

    // Unaccountable
    const unaccountable = totalGeneration - totalConsumption;

    return {
      total_consumption: {
        Total_Generation: totalGeneration.toFixed(5),
        Total_Consumption: totalConsumption.toFixed(5),
        Solar: solar.toFixed(5),
        Wapda_Import: Wapda.toFixed(5),
        Wapda_Export: Wapda2.toFixed(5),

        // Compressors
        Compressor1: Compressor1.toFixed(5),
        Compressor2: Compressor2.toFixed(5),
        Compressor3: Compressor3.toFixed(5),
        Sum_of_compressors: production.toFixed(5),

        // Rooms
        ...Object.fromEntries(
          Object.entries(roomConsumption).map(([k, v]) => [k, v.toFixed(5)]),
        ),
        Sum_of_rooms: totalRooms.toFixed(5),

        // Unaccountable
        Unaccountable_Energy: unaccountable.toFixed(5),
      },
    };
  }
}
