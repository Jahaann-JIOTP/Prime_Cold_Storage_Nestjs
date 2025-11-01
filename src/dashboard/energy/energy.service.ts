import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Energy, EnergyDocument } from './schemas/energy.schema';
import * as moment from 'moment-timezone';
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
    const WapdaKeys = ['U1_Active_Energy_Total_Consumed'];
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

    // Define the mapping between meter IDs and their database field names
    private readonly keyMapping: { [key: string]: string } = {
        'room1': 'U7_Active_Energy_Total_Consumed',
        'room2': 'U8_Active_Energy_Total_Consumed',
        'room3': 'U9_Active_Energy_Total_Consumed',
        'room4': 'U10_Active_Energy_Total_Consumed',
        'room5': 'U11_Active_Energy_Total_Consumed',
        'room6': 'U12_Active_Energy_Total_Consumed',
        'room7': 'U6_Active_Energy_Total_Consumed',
        'compressor1': 'U3_Active_Energy_Total_Consumed',
        'compressor2': 'U5_Active_Energy_Total_Consumed',
        'condensorpump': 'U4_Active_Energy_Total_Consumed'
    };

    // Define display names for each meter
    private readonly displayNames: { [key: string]: string } = {
        'room1': 'Room 1',
        'room2': 'Room 2',
        'room3': 'Room 3',
        'room4': 'Room 4',
        'room5': 'Room 5',
        'room6': 'Room 6',
        'room7': 'Room 7',
        'compressor1': 'Compressor 1',
        'compressor2': 'Compressor 2',
        'condensorpump': 'Condensor Pump (1+2)'
    };

    async getComputedHoursVsKWH(startDate: string, endDate: string, meterId: string[]) {
        const results: any[] = [];

        // Create moment objects for the date range
        const startMoment = moment.tz(startDate, 'YYYY-MM-DD', 'Asia/Karachi').startOf('day');
        const endMoment = moment.tz(endDate, 'YYYY-MM-DD', 'Asia/Karachi').endOf('day');

        console.log('KWH Query Parameters:', {
            startDate: startMoment.format('YYYY-MM-DD HH:mm:ss.SSS'),
            endDate: endMoment.format('YYYY-MM-DD HH:mm:ss.SSS'),
            meterId
        });

        // Loop through each day in the range
        const current = startMoment.clone();

        while (current.isSameOrBefore(endMoment, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');

            // For each day, we want from current day 00:00:00 to next day 00:00:00
            const dayStart = moment.tz(`${dateStr} 00:00:00.000`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');
            const dayEnd = moment.tz(`${dateStr} 23:59:59.999`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi')
                .add(1, 'minute'); // Include the first reading of next day

            const dayStartISO = dayStart.toISOString(true);
            const dayEndISO = dayEnd.toISOString(true);

            console.log(`\nProcessing date: ${dateStr}`, {
                dayStart: dayStartISO,
                dayEnd: dayEndISO
            });

            // Process each meter ID
            for (const meter of meterId) {
                const dbField = this.keyMapping[meter.toLowerCase()];

                if (!dbField) {
                    console.log(`Skipping ${meter} - no mapping found`);
                    continue;
                }

                console.log(`Querying for ${meter} (${dbField}) from ${dayStartISO} to ${dayEndISO}`);

                try {
                    // Get all documents for this meter where energy consumption > 0
                    const documents = await this.energyModel.find(
                        {
                            timestamp: { $gte: dayStartISO, $lte: dayEndISO },
                            [dbField]: { $exists: true, $ne: null, $gt: 0 }
                        },
                        { [dbField]: 1, timestamp: 1 },
                    ).sort({ timestamp: 1 }).lean();

                    console.log(`Found ${documents.length} documents with energy > 0 for ${meter}`);

                    if (documents.length >= 2) {
                        const firstDoc = documents[0];
                        const lastDoc = documents[documents.length - 1];

                        const startVal = firstDoc[dbField];
                        const endVal = lastDoc[dbField];
                        const consumption = endVal - startVal;

                        // Calculate runtime in seconds
                        const startTime = moment(firstDoc.timestamp);
                        const endTime = moment(lastDoc.timestamp);
                        const runtime_seconds = endTime.diff(startTime, 'seconds');

                        // Get display name
                        const displayName = this.displayNames[meter.toLowerCase()] || meter;

                        results.push({
                            keyType: meter,
                            name: displayName,
                            runtime_seconds,
                            consumption: parseFloat(consumption.toFixed(2)), // Round to 2 decimal places
                            startValue: startVal,
                            endValue: endVal,
                            startTimestamp: firstDoc.timestamp,
                            endTimestamp: lastDoc.timestamp,
                            documentCount: documents.length
                        });

                        console.log(`Added result for ${meter}:`, {
                            runtime_seconds,
                            consumption,
                            startValue: startVal,
                            endValue: endVal
                        });
                    } else {
                        console.log(`Insufficient data points for ${meter} (found ${documents.length} documents)`);

                        const displayName = this.displayNames[meter.toLowerCase()] || meter;
                        results.push({
                            keyType: meter,
                            name: displayName,
                            runtime_seconds: 0,
                            consumption: 0,
                            startValue: 0,
                            endValue: 0,
                            error: documents.length === 0 ? 'No energy consumption data found' : 'Insufficient data points'
                        });
                    }
                } catch (error) {
                    console.error(`Error querying for ${meter}:`, error);

                    const displayName = this.displayNames[meter.toLowerCase()] || meter;
                    results.push({
                        keyType: meter,
                        name: displayName,
                        runtime_seconds: 0,
                        consumption: 0,
                        error: error.message
                    });
                }
            }

            // Move to next day
            current.add(1, 'day');
            console.log(`Moving to next day: ${current.format('YYYY-MM-DD')}`);
        }

        console.log('\nFinal KWH results count:', results.length);

        // Return in the required response structure
        return {
            success: true,
            data: results
        };
    }
}
