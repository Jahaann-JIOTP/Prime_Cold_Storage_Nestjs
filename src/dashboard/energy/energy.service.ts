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
      const startMoment = moment.tz(start, 'YYYY-MM-DD', 'Asia/Karachi').startOf('day');
      const endMoment = moment.tz(end, 'YYYY-MM-DD', 'Asia/Karachi')
          .add(1, 'day')
          .add(1, 'minute');
    // Query
    const matchStage = {
      timestamp: {
            $gte: startMoment.toISOString(true),
            $lte: endMoment.toISOString(true),
      },
      };
      console.log('Adjusted Query Range:', {
          start: startMoment.format('YYYY-MM-DD HH:mm:ss.SSS'),
          end: endMoment.format('YYYY-MM-DD HH:mm:ss.SSS')
      });
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
        const startMoment = moment.tz(startDate, 'YYYY-MM-DD', 'Asia/Karachi').startOf('day');
        const endMoment = moment.tz(endDate, 'YYYY-MM-DD', 'Asia/Karachi').endOf('day');
        const current = startMoment.clone();

        console.log('=== Starting getComputedHoursVsKWH ===');
        console.log('Input Parameters:', { startDate, endDate, meterId });
        console.log('Processing date range:', {
            start: startMoment.format('YYYY-MM-DD'),
            end: endMoment.format('YYYY-MM-DD')
        });

        while (current.isSameOrBefore(endMoment, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');

            // For each day, we want from current day 00:00:00 to next day 00:00:00
            const dayStart = moment.tz(`${dateStr} 00:00:00.000`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');
            const dayEnd = moment.tz(`${dateStr} 23:59:59.999`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi')
                .add(1, 'minute'); // Include the first reading of next day

            const dayStartISO = dayStart.toISOString(true);
            const dayEndISO = dayEnd.toISOString(true);

            console.log(`\n=== Processing date: ${dateStr} ===`);
            console.log('Day Range:', {
                dayStart: dayStartISO,
                dayEnd: dayEndISO
            });

            // Process each meter ID
            for (const meter of meterId) {
                const dbField = this.keyMapping[meter.toLowerCase()];

                if (!dbField) {
                    console.log(`❌ Skipping ${meter} - no mapping found`);
                    continue;
                }

                console.log(`\n🔧 Processing meter: ${meter} (DB Field: ${dbField})`);

                try {
                    // Get ALL documents for this meter in the time range (not just > 0)
                    const allDocuments = await this.energyModel.find(
                        {
                            timestamp: { $gte: dayStartISO, $lte: dayEndISO },
                            [dbField]: { $exists: true, $ne: null }
                        },
                        { [dbField]: 1, timestamp: 1 },
                    ).sort({ timestamp: 1 }).lean();

                    console.log(`📊 Found ${allDocuments.length} total documents for ${meter}`);

                    if (allDocuments.length < 2) {
                        console.log(`❌ Insufficient documents for ${meter} (need at least 2, found ${allDocuments.length})`);
                        const displayName = this.displayNames[meter.toLowerCase()] || meter;
                        results.push({
                            keyType: meter,
                            name: displayName,
                            runtime_seconds: 0,
                            consumption: 0,
                            startValue: 0,
                            endValue: 0,
                            error: allDocuments.length === 0 ? 'No data found' : 'Insufficient data points'
                        });
                        continue;
                    }

                    // Filter documents where energy consumption is actively increasing
                    const activeDocuments = this.filterActiveEnergyPeriods(allDocuments, dbField);

                    console.log(`⚡ Active energy periods: ${activeDocuments.length} segments found`);

                    let totalRuntimeSeconds = 0;
                    let totalConsumption = 0;

                    // Calculate runtime and consumption for each active period
                    for (const period of activeDocuments) {
                        if (period.documents.length >= 2) {
                            const periodStart = moment(period.documents[0].timestamp);
                            const periodEnd = moment(period.documents[period.documents.length - 1].timestamp);
                            const periodRuntime = periodEnd.diff(periodStart, 'seconds');

                            const periodStartVal = period.documents[0][dbField];
                            const periodEndVal = period.documents[period.documents.length - 1][dbField];
                            const periodConsumption = periodEndVal - periodStartVal;

                            totalRuntimeSeconds += periodRuntime;
                            totalConsumption += periodConsumption;

                            console.log(`📈 Active Period: ${periodStart.format('HH:mm:ss')} to ${periodEnd.format('HH:mm:ss')}`, {
                                runtime_seconds: periodRuntime,
                                consumption: periodConsumption.toFixed(2),
                                documents: period.documents.length
                            });
                        }
                    }

                    // Get first and last values for the entire day
                    const firstVal = allDocuments[0][dbField];
                    const lastVal = allDocuments[allDocuments.length - 1][dbField];
                    const dailyConsumption = lastVal - firstVal;

                    console.log(`📋 Daily Summary for ${meter}:`, {
                        total_runtime_seconds: totalRuntimeSeconds,
                        total_consumption: totalConsumption.toFixed(2),
                        daily_consumption: dailyConsumption.toFixed(2),
                        first_value: firstVal,
                        last_value: lastVal,
                        active_periods: activeDocuments.length
                    });

                    const displayName = this.displayNames[meter.toLowerCase()] || meter;

                    results.push({
                        keyType: meter,
                        name: displayName,
                        runtime_seconds: totalRuntimeSeconds,
                        consumption: parseFloat(totalConsumption.toFixed(2)),
                        startValue: firstVal,
                        endValue: lastVal,
                        startTimestamp: allDocuments[0].timestamp,
                        endTimestamp: allDocuments[allDocuments.length - 1].timestamp,
                        documentCount: allDocuments.length,
                        activePeriods: activeDocuments.length
                    });

                    console.log(`✅ Added result for ${meter}`);

                } catch (error) {
                    console.error(`💥 Error querying for ${meter}:`, error);

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
            console.log(`\n🔄 Moving to next day: ${current.format('YYYY-MM-DD')}`);
        }

        console.log('\n=== Final Results Summary ===');
        console.log(`Total results: ${results.length}`);
        results.forEach(result => {
            console.log(`- ${result.keyType}: ${result.runtime_seconds}s runtime, ${result.consumption} kWh`);
        });

        // Return in the required response structure
        return {
            success: true,
            data: results
        };
    }

    // Helper function to filter active energy consumption periods
    private filterActiveEnergyPeriods(documents: any[], dbField: string): Array<{ documents: any[] }> {
        const activePeriods: Array<{ documents: any[] }> = [];
        let currentPeriod: any[] = [];

        for (let i = 0; i < documents.length; i++) {
            const currentDoc = documents[i];
            const currentValue = currentDoc[dbField];

            // If this is the first document, start a new period
            if (currentPeriod.length === 0) {
                currentPeriod.push(currentDoc);
                continue;
            }

            const previousDoc = currentPeriod[currentPeriod.length - 1];
            const previousValue = previousDoc[dbField];

            // If energy is increasing or same, continue the current period
            if (currentValue >= previousValue) {
                currentPeriod.push(currentDoc);
            } else {
                // Energy decreased, end the current period and start a new one
                if (currentPeriod.length >= 2) {
                    activePeriods.push({ documents: [...currentPeriod] });
                }
                currentPeriod = [currentDoc];
            }
        }

        // Don't forget the last period
        if (currentPeriod.length >= 2) {
            activePeriods.push({ documents: currentPeriod });
        }

        return activePeriods;
    }
}