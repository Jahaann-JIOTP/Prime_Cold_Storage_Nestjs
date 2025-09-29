// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { MongoClient } from 'mongodb';
// // import * as moment from 'moment-timezone';
// import * as moment from 'moment';
// import { PrimeHistoricalDataDocument } from './schemas/prime-historical-data.schema';

// @Injectable()
// export class ConVsProService {
//   constructor(
//     @InjectModel('con_vs_pro')
//     private readonly conModel: Model<PrimeHistoricalDataDocument>,
//   ) {}

//   async getPowerAverages(startDate: string, endDate: string) {
//     // const db = await this.connect();
//     // const collection = db.collection('prime_historical_data');
//     const collection = this.conModel.collection;

//     // Parse input dates as start and end of day in Asia/Karachi timezone,
//     // then convert to UTC Date for MongoDB query
//     const startDateTime = moment
//       .tz(startDate, 'YYYY-MM-DD', 'Asia/Karachi')
//       .startOf('day')
//       .utc()
//       .toDate();
//     const endDateTime = moment
//       .tz(endDate, 'YYYY-MM-DD', 'Asia/Karachi')
//       .endOf('day')
//       .utc()
//       .toDate();

//     // Aggregation pipeline
//     const pipeline = [
//       // Convert timestamp string to Date (UTC)
//       {
//         $addFields: {
//           date: { $toDate: '$timestamp' },
//         },
//       },
//       // Filter dates between start and end (stored in UTC)
//       {
//         $match: {
//           date: {
//             $gte: startDateTime,
//             $lte: endDateTime,
//           },
//         },
//       },
//       // Truncate to hour respecting Asia/Karachi timezone
//       {
//         $addFields: {
//           hourStart: {
//             $dateTrunc: {
//               date: '$date',
//               unit: 'hour',
//               timezone: 'Asia/Karachi',
//             },
//           },
//         },
//       },
//       { $sort: { date: 1 } },
//       {
//         $group: {
//           _id: '$hourStart',
//           first_solar: { $first: { $ifNull: ['$U2_Active_Energy_Total', 0] } },
//           last_solar: { $last: { $ifNull: ['$U2_Active_Energy_Total', 0] } },

//           first_wapda: {
//             $first: { $ifNull: ['$U1_Active_Energy_Total_Consumed', 0] },
//           },
//           last_wapda: {
//             $last: { $ifNull: ['$U1_Active_Energy_Total_Consumed', 0] },
//           },

//           first_compressor1: {
//             $first: { $ifNull: ['$U3_Active_Energy_Total_Consumed', 0] },
//           },
//           last_compressor1: {
//             $last: { $ifNull: ['$U3_Active_Energy_Total_Consumed', 0] },
//           },

//           first_compressor2: {
//             $first: { $ifNull: ['$U4_Active_Energy_Total_Consumed', 0] },
//           },
//           last_compressor2: {
//             $last: { $ifNull: ['$U4_Active_Energy_Total_Consumed', 0] },
//           },

//           first_compressor3: {
//             $first: { $ifNull: ['$U5_Active_Energy_Total_Consumed', 0] },
//           },
//           last_compressor3: {
//             $last: { $ifNull: ['$U5_Active_Energy_Total_Consumed', 0] },
//           },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ];

//     const data = await collection.aggregate(pipeline).toArray();

//     return data.map((entry) => {
//       const solar = (entry.last_solar || 0) - (entry.first_solar || 0);
//       const wapda = (entry.last_wapda || 0) - (entry.first_wapda || 0);

//       const compressor1 =
//         (entry.last_compressor1 || 0) - (entry.first_compressor1 || 0);
//       const compressor2 =
//         (entry.last_compressor2 || 0) - (entry.first_compressor2 || 0);
//       const compressor3 =
//         (entry.last_compressor3 || 0) - (entry.first_compressor3 || 0);

//       const sum_of_compressors = compressor1 + compressor2 + compressor3;
//       const total_consumption = solar + wapda;
//       const losses = total_consumption - sum_of_compressors;

//       // Format date in Asia/Karachi timezone for output
//       const formattedDate = moment(entry._id)
//         .tz('Asia/Karachi')
//         .format('YYYY-MM-DD HH:mm');

//       return {
//         date: formattedDate,
//         solar: +solar.toFixed(2),
//         wapda: +wapda.toFixed(2),
//         compressor1: +compressor1.toFixed(2),
//         compressor2: +compressor2.toFixed(2),
//         compressor3: +compressor3.toFixed(2),
//         losses: +losses.toFixed(2),
//       };
//     });
//   }

//   async getPowerData(startDate: string, endDate: string, label: string) {
//     if (label === 'hourly') {
//       return this.getPowerAverages(startDate, endDate);
//     } else if (label === 'daily') {
//       return this.getDailyPowerAverages(startDate, endDate);
//     } else if (label === 'monthly') {
//       return this.getMonthlyAverages(startDate, endDate);
//     } else {
//       return this.getPowerAverages(startDate, endDate);
//     }
//   }

//   async getDailyPowerAverages(start: string, end: string) {
//     // const db = await this.connect();
//     // const collection = db.collection('prime_historical_data');
//     const collection = this.conModel.collection;

//     const meterIds = ['U1', 'U2', 'U3', 'U4', 'U5'];
//     const suffixes: string[] = [
//       'Active_Energy_Total_Consumed',
//       'Active_Energy_Total',
//     ];

//     const solarKeys = ['U2_Active_Energy_Total'];
//     const WapdaKeys = ['U1_Active_Energy_Total_Consumed'];

//     const Compressor1Key = 'U3_Active_Energy_Total_Consumed';
//     const Compressor2Key = 'U4_Active_Energy_Total_Consumed';
//     const Compressor3Key = 'U5_Active_Energy_Total_Consumed';

//     // Get all records in the date range
//     const matchStage = {
//       timestamp: {
//         $gte: `${start}T00:00:00.000+05:00`,
//         $lte: `${end}T23:59:59.999+05:00`,
//       },
//     };

//     const projection: { [key: string]: number } = { timestamp: 1 };
//     for (const id of meterIds) {
//       for (const suffix of suffixes) {
//         projection[`${id}_${suffix}`] = 1;
//       }
//     }

//     // Fetch all documents matching the date range and projection, sorted by timestamp ascending
//     const result = await collection
//       .find(matchStage)
//       .project(projection)
//       .sort({ timestamp: 1 })
//       .toArray();

//     // Group documents by date string "YYYY-MM-DD"
//     const groupedByDate = result.reduce(
//       (acc, doc) => {
//         const dateStr = doc.timestamp.substring(0, 10); // assuming timestamp is ISO string
//         if (!acc[dateStr]) acc[dateStr] = [];
//         acc[dateStr].push(doc);
//         return acc;
//       },
//       {} as Record<string, any[]>,
//     );

//     const dailyResults = [];

//     for (const date in groupedByDate) {
//       const docs = groupedByDate[date];

//       const firstDoc = docs[0];
//       const lastDoc = docs[docs.length - 1];

//       // Calculate consumption per key based on first and last doc
//       const consumption: Record<string, number> = {};

//       for (const id of meterIds) {
//         for (const suffix of suffixes) {
//           const key = `${id}_${suffix}`;
//           const firstVal = firstDoc[key] ?? 0;
//           const lastVal = lastDoc[key] ?? 0;
//           consumption[key] = lastVal - firstVal;
//         }
//       }

//       // Sum groups according to your keys
//       const sumGroup = (keys: string[]) =>
//         keys.reduce((sum, key) => sum + (consumption[key] || 0), 0);

//       const solar = sumGroup(solarKeys);
//       const wapda = sumGroup(WapdaKeys);

//       const totalGeneration = solar + wapda;

//       const compressor1 = consumption[Compressor1Key] || 0;
//       const compressor2 = consumption[Compressor2Key] || 0;
//       const compressor3 = consumption[Compressor3Key] || 0;
//       const totalCompressors = compressor1 + compressor2 + compressor3;

//       // const unaccounted = totalGeneration - totalCompressors;
//       const losses = totalGeneration - totalCompressors;

//       // Define type for daily result
//       type DailyResult = {
//         date: string;
//         solar: number;
//         wapda: number;
//         compressor1: number;
//         compressor2: number;
//         compressor3: number;
//         // total_compressors: number;
//         // total_consumption: number;
//         // unaccounted_energy: number;
//         losses: number;
//       };

//       // ...

//       const dailyResults: DailyResult[] = [];

//       // ... your grouping and calculation logic ...

//       dailyResults.push({
//         date,
//         solar: +solar.toFixed(5),
//         wapda: +wapda.toFixed(5),
//         compressor1: +compressor1.toFixed(5),
//         compressor2: +compressor2.toFixed(5),
//         compressor3: +compressor3.toFixed(5),
//         // total_compressors: +totalCompressors.toFixed(5),
//         // total_consumption: +totalGeneration.toFixed(5),
//         // unaccounted_energy: +unaccounted.toFixed(5),
//         losses: +losses.toFixed(2),
//       });

//       return dailyResults;
//     }

//     // Return array of daily consumption objects
//     return dailyResults;
//   }

//   async getMonthlyAverages(startDate: string, endDate: string) {
//     // const db = await this.connect();
//     // const collection = db.collection('prime_historical_data');
//     const collection = this.conModel.collection;

//     const startISO = new Date(startDate + 'T00:00:00.000Z');
//     const endISO = new Date(endDate + 'T23:59:59.999Z');

//     const meterFields = [
//       { name: 'solar', field: 'U2_Active_Energy_Total' },
//       { name: 'wapda', field: 'U1_Active_Energy_Total_Consumed' },

//       { name: 'compressor1', field: 'U3_Active_Energy_Total_Consumed' },
//       { name: 'compressor2', field: 'U4_Active_Energy_Total_Consumed' },
//       { name: 'compressor3', field: 'U5_Active_Energy_Total_Consumed' },
//     ];

//     const results: any = {};

//     for (const meter of meterFields) {
//       const pipeline = [
//         {
//           $match: {
//             $expr: {
//               $and: [
//                 { $gte: [{ $toDate: '$timestamp' }, startISO] },
//                 { $lte: [{ $toDate: '$timestamp' }, endISO] },
//               ],
//             },
//             [meter.field]: { $ne: null },
//           },
//         },
//         {
//           $addFields: {
//             date: { $toDate: '$timestamp' },
//           },
//         },
//         {
//           $addFields: {
//             month: {
//               $dateTrunc: {
//                 date: '$date',
//                 unit: 'month',
//               },
//             },
//           },
//         },
//         {
//           $sort: { date: 1 },
//         },
//         {
//           $group: {
//             _id: '$month',
//             firstDoc: { $first: '$$ROOT' },
//             lastDoc: { $last: '$$ROOT' },
//           },
//         },
//         {
//           $project: {
//             month: '$_id',
//             firstValue: `$firstDoc.${meter.field}`,
//             lastValue: `$lastDoc.${meter.field}`,
//             value: {
//               $subtract: [
//                 `$lastDoc.${meter.field}`,
//                 `$firstDoc.${meter.field}`,
//               ],
//             },
//             _id: 0,
//           },
//         },
//         { $sort: { month: 1 } },
//       ];

//       const data = await collection.aggregate(pipeline).toArray();

//       for (const item of data) {
//         const monthStr = item.month.toISOString().slice(0, 7);
//         if (!results[monthStr]) {
//           results[monthStr] = {
//             date: monthStr,
//             solar: 0,
//             wapda: 0,

//             compressor1: 0,
//             compressor2: 0,
//             compressor3: 0,
//           };
//         }
//         results[monthStr][meter.name] = +item.value.toFixed(2);
//       }
//     }

//     const final = Object.values(results).map((entry: any) => {
//       const totalCompressors =
//         entry.compressor1 + entry.compressor2 + entry.compressor3;
//       const totalGeneration = entry.solar + entry.wapda;
//       // const unaccounted = totalGeneration - totalCompressors;
//       const losses = totalGeneration - totalCompressors;
//       return {
//         ...entry,
//         // total_compressors: +totalCompressors.toFixed(2),
//         // total_consumption: +totalGeneration.toFixed(2),
//         // unaccounted_energy: +unaccounted.toFixed(2),
//         losses: +losses.toFixed(2),
//       };
//     });

//     return final;
//   }
// }

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { PrimeHistoricalDataDocument } from './schemas/prime-historical-data.schema';

// -------------------- TYPES --------------------
type HourlyResult = {
  date: string;
  solar: number;
  wapda: number;
  compressor1: number;
  compressor2: number;
  compressor3: number;
  losses: number;
  room1: number;
  room2: number;
  room3: number;
  room4: number;
  room5: number;
  room6: number;
  room7: number;
};

type DailyResult = HourlyResult;

type MonthlyResult = HourlyResult & {};

// -------------------- SERVICE --------------------
@Injectable()
export class ConVsProService {
  constructor(
    @InjectModel('con_vs_pro')
    private readonly conModel: Model<PrimeHistoricalDataDocument>,
  ) {}

  // -------------------- HOURLY --------------------
  async getPowerAverages(
    startDate: string,
    endDate: string,
  ): Promise<HourlyResult[]> {
    const collection = this.conModel.collection;

    const startDateTime = moment
      .tz(startDate, 'YYYY-MM-DD', 'Asia/Karachi')
      .startOf('day')
      .utc()
      .toDate();
    const endDateTime = moment
      .tz(endDate, 'YYYY-MM-DD', 'Asia/Karachi')
      .endOf('day')
      .utc()
      .toDate();

    const pipeline = [
      { $addFields: { date: { $toDate: '$timestamp' } } },
      { $match: { date: { $gte: startDateTime, $lte: endDateTime } } },
      {
        $addFields: {
          hourStart: {
            $dateTrunc: {
              date: '$date',
              unit: 'hour',
              timezone: 'Asia/Karachi',
            },
          },
        },
      },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: '$hourStart',
          // Solar & Wapda
          first_solar: {
            $first: { $ifNull: ['$U2_Active_Energy_Total_Consumed', 0] },
          },
          last_solar: {
            $last: { $ifNull: ['$U2_Active_Energy_Total_Consumed', 0] },
          },

          first_wapda: {
            $first: { $ifNull: ['$U1_Active_Energy_Total_Consumed', 0] },
          },
          last_wapda: {
            $last: { $ifNull: ['$U1_Active_Energy_Total_Consumed', 0] },
          },

          // Compressors
          first_compressor1: {
            $first: { $ifNull: ['$U3_Active_Energy_Total_Consumed', 0] },
          },
          last_compressor1: {
            $last: { $ifNull: ['$U3_Active_Energy_Total_Consumed', 0] },
          },

          first_compressor2: {
            $first: { $ifNull: ['$U4_Active_Energy_Total_Consumed', 0] },
          },
          last_compressor2: {
            $last: { $ifNull: ['$U4_Active_Energy_Total_Consumed', 0] },
          },

          first_compressor3: {
            $first: { $ifNull: ['$U5_Active_Energy_Total_Consumed', 0] },
          },
          last_compressor3: {
            $last: { $ifNull: ['$U5_Active_Energy_Total_Consumed', 0] },
          },

          // Rooms (U6–U12)
          first_room1: {
            $first: { $ifNull: ['$U7_Active_Energy_Total_Consumed', 0] },
          },
          last_room1: {
            $last: { $ifNull: ['$U7_Active_Energy_Total_Consumed', 0] },
          },

          first_room2: {
            $first: { $ifNull: ['$U8_Active_Energy_Total_Consumed', 0] },
          },
          last_room2: {
            $last: { $ifNull: ['$U8_Active_Energy_Total_Consumed', 0] },
          },

          first_room3: {
            $first: { $ifNull: ['$U9_Active_Energy_Total_Consumed', 0] },
          },
          last_room3: {
            $last: { $ifNull: ['$U9_Active_Energy_Total_Consumed', 0] },
          },

          first_room4: {
            $first: { $ifNull: ['$U10_Active_Energy_Total_Consumed', 0] },
          },
          last_room4: {
            $last: { $ifNull: ['$U10_Active_Energy_Total_Consumed', 0] },
          },

          first_room5: {
            $first: { $ifNull: ['$U11_Active_Energy_Total_Consumed', 0] },
          },
          last_room5: {
            $last: { $ifNull: ['$U11_Active_Energy_Total_Consumed', 0] },
          },

          first_room6: {
            $first: { $ifNull: ['$U12_Active_Energy_Total_Consumed', 0] },
          },
          last_room6: {
            $last: { $ifNull: ['$U12_Active_Energy_Total_Consumed', 0] },
          },

          first_room7: {
            $first: { $ifNull: ['$U6_Active_Energy_Total_Consumed', 0] },
          },
          last_room7: {
            $last: { $ifNull: ['$U6_Active_Energy_Total_Consumed', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return data.map((entry) => {
      const solar = (entry.last_solar || 0) - (entry.first_solar || 0);
      const wapda = (entry.last_wapda || 0) - (entry.first_wapda || 0);

      const compressor1 =
        (entry.last_compressor1 || 0) - (entry.first_compressor1 || 0);
      const compressor2 =
        (entry.last_compressor2 || 0) - (entry.first_compressor2 || 0);
      const compressor3 =
        (entry.last_compressor3 || 0) - (entry.first_compressor3 || 0);

      const room1 = (entry.last_room1 || 0) - (entry.first_room1 || 0);
      const room2 = (entry.last_room2 || 0) - (entry.first_room2 || 0);
      const room3 = (entry.last_room3 || 0) - (entry.first_room3 || 0);
      const room4 = (entry.last_room4 || 0) - (entry.first_room4 || 0);
      const room5 = (entry.last_room5 || 0) - (entry.first_room5 || 0);
      const room6 = (entry.last_room6 || 0) - (entry.first_room6 || 0);
      const room7 = (entry.last_room7 || 0) - (entry.first_room7 || 0);

      const sum_of_compressors =
        compressor1 +
        compressor2 +
        compressor3 +
        room1 +
        room2 +
        room3 +
        room4 +
        room5 +
        room6 +
        room7;

      const total_consumption = solar + wapda;
      const losses = total_consumption - sum_of_compressors;

      const formattedDate = moment(entry._id)
        .tz('Asia/Karachi')
        .format('YYYY-MM-DD HH:mm');

      return {
        date: formattedDate,
        solar: +solar.toFixed(2),
        wapda: +wapda.toFixed(2),
        compressor1: +compressor1.toFixed(2),
        compressor2: +compressor2.toFixed(2),
        compressor3: +compressor3.toFixed(2),
        losses: +losses.toFixed(2),
        room1: +room1.toFixed(2),
        room2: +room2.toFixed(2),
        room3: +room3.toFixed(2),
        room4: +room4.toFixed(2),
        room5: +room5.toFixed(2),
        room6: +room6.toFixed(2),
        room7: +room7.toFixed(2),
      };
    });
  }

  // -------------------- DAILY --------------------
  async getDailyPowerAverages(
    start: string,
    end: string,
  ): Promise<DailyResult[]> {
    const collection = this.conModel.collection;

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
    ];

    const solarKeys = ['U2_Active_Energy_Total_Consumed'];
    const WapdaKeys = ['U1_Active_Energy_Total'];

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

    const result = await collection
      .find(matchStage)
      .project(projection)
      .sort({ timestamp: 1 })
      .toArray();

    const groupedByDate = result.reduce(
      (acc, doc) => {
        const dateStr = doc.timestamp.substring(0, 10);
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(doc);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const dailyResults: DailyResult[] = [];

    for (const date in groupedByDate) {
      const docs = groupedByDate[date];
      const firstDoc = docs[0];
      const lastDoc = docs[docs.length - 1];

      const consumption: Record<string, number> = {};
      for (const id of meterIds) {
        for (const suffix of suffixes) {
          const key = `${id}_${suffix}`;
          const firstVal = firstDoc[key] ?? 0;
          const lastVal = lastDoc[key] ?? 0;
          consumption[key] = lastVal - firstVal;
        }
      }

      const sumGroup = (keys: string[]) =>
        keys.reduce((sum, key) => sum + (consumption[key] || 0), 0);

      const solar = sumGroup(solarKeys);
      const wapda = sumGroup(WapdaKeys);

      const compressor1 = consumption['U3_Active_Energy_Total_Consumed'] || 0;
      const compressor2 = consumption['U4_Active_Energy_Total_Consumed'] || 0;
      const compressor3 = consumption['U5_Active_Energy_Total_Consumed'] || 0;

      const room1 = consumption['U7_Active_Energy_Total_Consumed'] || 0;
      const room2 = consumption['U8_Active_Energy_Total_Consumed'] || 0;
      const room3 = consumption['U9_Active_Energy_Total_Consumed'] || 0;
      const room4 = consumption['U10_Active_Energy_Total_Consumed'] || 0;
      const room5 = consumption['U11_Active_Energy_Total_Consumed'] || 0;
      const room6 = consumption['U12_Active_Energy_Total_Consumed'] || 0;
      const room7 = consumption['U6_Active_Energy_Total_Consumed'] || 0;

      const totalGeneration = solar + wapda;
      const totalCompressors =
        compressor1 +
        compressor2 +
        compressor3 +
        room1 +
        room2 +
        room3 +
        room4 +
        room5 +
        room6 +
        room7;

      const losses = totalGeneration - totalCompressors;

      dailyResults.push({
        date,
        solar: +solar.toFixed(5),
        wapda: +wapda.toFixed(5),
        compressor1: +compressor1.toFixed(5),
        compressor2: +compressor2.toFixed(5),
        compressor3: +compressor3.toFixed(5),
        losses: +losses.toFixed(2),
        room1: +room1.toFixed(5),
        room2: +room2.toFixed(5),
        room3: +room3.toFixed(5),
        room4: +room4.toFixed(5),
        room5: +room5.toFixed(5),
        room6: +room6.toFixed(5),
        room7: +room7.toFixed(5),
      });
    }

    return dailyResults;
  }

  // -------------------- MONTHLY --------------------
  async getMonthlyAverages(
    startDate: string,
    endDate: string,
  ): Promise<MonthlyResult[]> {
    const collection = this.conModel.collection;

    const startISO = new Date(startDate + 'T00:00:00.000Z');
    const endISO = new Date(endDate + 'T23:59:59.999Z');

    const meterFields = [
      { name: 'solar', field: 'U2_Active_Energy_Total_Consumed' },
      { name: 'wapda', field: 'U1_Active_Energy_Total_Consumed' },
      { name: 'compressor1', field: 'U3_Active_Energy_Total_Consumed' },
      { name: 'compressor2', field: 'U4_Active_Energy_Total_Consumed' },
      { name: 'compressor3', field: 'U5_Active_Energy_Total_Consumed' },
      { name: 'room1', field: 'U7_Active_Energy_Total_Consumed' },
      { name: 'room2', field: 'U8_Active_Energy_Total_Consumed' },
      { name: 'room3', field: 'U9_Active_Energy_Total_Consumed' },
      { name: 'room4', field: 'U10_Active_Energy_Total_Consumed' },
      { name: 'room5', field: 'U11_Active_Energy_Total_Consumed' },
      { name: 'room6', field: 'U12_Active_Energy_Total_Consumed' },
      { name: 'room7', field: 'U6_Active_Energy_Total_Consumed' },
    ];

    const results: any = {};

    for (const meter of meterFields) {
      const pipeline = [
        {
          $match: {
            $expr: {
              $and: [
                { $gte: [{ $toDate: '$timestamp' }, startISO] },
                { $lte: [{ $toDate: '$timestamp' }, endISO] },
              ],
            },
            [meter.field]: { $ne: null },
          },
        },
        { $addFields: { date: { $toDate: '$timestamp' } } },
        {
          $addFields: {
            month: { $dateTrunc: { date: '$date', unit: 'month' } },
          },
        },
        { $sort: { date: 1 } },
        {
          $group: {
            _id: '$month',
            firstDoc: { $first: '$$ROOT' },
            lastDoc: { $last: '$$ROOT' },
          },
        },
        {
          $project: {
            month: '$_id',
            firstValue: `$firstDoc.${meter.field}`,
            lastValue: `$lastDoc.${meter.field}`,
            value: {
              $subtract: [
                `$lastDoc.${meter.field}`,
                `$firstDoc.${meter.field}`,
              ],
            },
            _id: 0,
          },
        },
        { $sort: { month: 1 } },
      ];

      const data = await collection.aggregate(pipeline).toArray();

      for (const item of data) {
        const monthStr = item.month.toISOString().slice(0, 7);
        if (!results[monthStr]) {
          results[monthStr] = {
            date: monthStr,
            solar: 0,
            wapda: 0,
            compressor1: 0,
            compressor2: 0,
            compressor3: 0,
            room1: 0,
            room2: 0,
            room3: 0,
            room4: 0,
            room5: 0,
            room6: 0,
            room7: 0,
          };
        }
        results[monthStr][meter.name] = +item.value.toFixed(2);
      }
    }

    const final = Object.values(results).map((entry: any) => {
      const totalCompressors =
        entry.compressor1 +
        entry.compressor2 +
        entry.compressor3 +
        entry.room1 +
        entry.room2 +
        entry.room3 +
        entry.room4 +
        entry.room5 +
        entry.room6 +
        entry.room7;

      const totalGeneration = entry.solar + entry.wapda;
      const losses = totalGeneration - totalCompressors;
      return {
        ...entry,
        losses: +losses.toFixed(2),
      };
    });

    return final as MonthlyResult[];
  }

  // -------------------- MAIN DISPATCH --------------------
  async getPowerData(startDate: string, endDate: string, label: string) {
    if (label === 'hourly') {
      return this.getPowerAverages(startDate, endDate);
    } else if (label === 'daily') {
      return this.getDailyPowerAverages(startDate, endDate);
    } else if (label === 'monthly') {
      return this.getMonthlyAverages(startDate, endDate);
    } else {
      return this.getPowerAverages(startDate, endDate);
    }
  }
}
