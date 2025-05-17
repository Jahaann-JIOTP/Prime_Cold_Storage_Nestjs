import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';

@Injectable()
export class ConVsProService {
  private readonly uri = 'mongodb://admin:cisco123@13.234.241.103:27017/?authSource=iotdb';
  private readonly dbName = 'iotdb';
  private client: MongoClient;

  async connect() {
    if (!this.client) {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
    }
    return this.client.db(this.dbName);
  }


async getPowerAverages(startDate: string, endDate: string) {
  const db = await this.connect();
  const collection = db.collection('prime_historical_data');

  // Define timezone offset +05:00 for Pakistan
  const startISO = new Date(`${startDate}T00:00:00.000+05:00`);
  const endISO = new Date(`${endDate}T23:59:59.999+05:00`);

  const pipeline = [
    {
      $match: {
        timestamp: {
          $gte: `${startDate}T00:00:00.000+05:00`,
          $lte: `${endDate}T23:59:59.999+05:00`,
        }
      }
    },
    {
      $addFields: {
        // Convert timestamp string to Date
        date: { $toDate: "$timestamp" }
      }
    },
    {
      // Create a new field hourStart which represents the start of the hour (like 2025-05-15 13:00:00)
      $addFields: {
        hourStart: {
          $dateTrunc: {
            date: "$date",
            unit: "hour",
            binSize: 1,
            timezone: "+05:00"
          }
        }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: "$hourStart",

        first_solar: { $first: { $ifNull: ["$U2_Active_Energy_Total_Consumed", 0] } },
        last_solar: { $last: { $ifNull: ["$U2_Active_Energy_Total_Consumed", 0] } },

        first_wapda: { $first: { $ifNull: ["$U1_Active_Energy_Total_Consumed", 0] } },
        last_wapda: { $last: { $ifNull: ["$U1_Active_Energy_Total_Consumed", 0] } },

        first_compressor1: { $first: { $ifNull: ["$U3_Active_Energy_Total_Consumed", 0] } },
        last_compressor1: { $last: { $ifNull: ["$U3_Active_Energy_Total_Consumed", 0] } },

        first_compressor2: { $first: { $ifNull: ["$U4_Active_Energy_Total_Consumed", 0] } },
        last_compressor2: { $last: { $ifNull: ["$U4_Active_Energy_Total_Consumed", 0] } },

        first_compressor3: { $first: { $ifNull: ["$U5_Active_Energy_Total_Consumed", 0] } },
        last_compressor3: { $last: { $ifNull: ["$U5_Active_Energy_Total_Consumed", 0] } },
      }
    },
    {
      $sort: { _id: 1 }
    }
  ];

  const data = await collection.aggregate(pipeline).toArray();

  return data.map((entry) => {
    const solar = (entry.last_solar || 0) - (entry.first_solar || 0);
    const wapda = (entry.last_wapda || 0) - (entry.first_wapda || 0);

    const compressor1 = (entry.last_compressor1 || 0) - (entry.first_compressor1 || 0);
    const compressor2 = (entry.last_compressor2 || 0) - (entry.first_compressor2 || 0);
    const compressor3 = (entry.last_compressor3 || 0) - (entry.first_compressor3 || 0);

    const sum_of_compressors = compressor1 + compressor2 + compressor3;
    const total_consumption = solar + wapda;
    // const unaccounted = total_consumption - sum_of_compressors;
 const losses = total_consumption - sum_of_compressors;
    // Convert _id (hourStart) to ISO string with timezone offset if needed
    const hourDate = new Date(entry._id);

    const formattedDate = `${hourDate.getFullYear()}-${String(hourDate.getMonth()+1).padStart(2,'0')}-${String(hourDate.getDate()).padStart(2,'0')} ${String(hourDate.getHours()).padStart(2,'0')}:00`;

    return {
      datetime: formattedDate,
      solar: +solar.toFixed(2),
      wapda: +wapda.toFixed(2),
      compressor1: +compressor1.toFixed(2),
      compressor2: +compressor2.toFixed(2),
      compressor3: +compressor3.toFixed(2),
      // total_compressors: +sum_of_compressors.toFixed(2),
      // total_consumption: +total_consumption.toFixed(2),
      // unaccounted_energy: +unaccounted.toFixed(2),
       losses: +losses.toFixed(2),
    };
  });
}







  async getPowerData(startDate: string, endDate: string, label: string) {
    if (label === 'hourly') {
      return this.getPowerAverages(startDate, endDate);
    } else if (label === 'daily') {
      return this.getDailyPowerAverages(startDate, endDate);
    } else if (label === 'monthly') {
      return this.getMonthlyAverages(startDate, endDate);
    }else {
      return this.getPowerAverages(startDate, endDate);
    }
  }












async getDailyPowerAverages(start: string, end: string) {
  const db = await this.connect();
  const collection = db.collection('prime_historical_data');

  const meterIds = ["U1", "U2", "U3", "U4", "U5"];
  const suffixes: string[] = ['Active_Energy_Total_Consumed'];

  const solarKeys = ['U2_Active_Energy_Total_Consumed'];
  const WapdaKeys = ['U1_Active_Energy_Total_Consumed'];

  const Compressor1Key = 'U3_Active_Energy_Total_Consumed';
  const Compressor2Key = 'U4_Active_Energy_Total_Consumed';
  const Compressor3Key = 'U5_Active_Energy_Total_Consumed';

  // Get all records in the date range
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

  // Fetch all documents matching the date range and projection, sorted by timestamp ascending
  const result = await collection
    .find(matchStage)
    .project(projection)
    .sort({ timestamp: 1 })
    .toArray();

  // Group documents by date string "YYYY-MM-DD"
  const groupedByDate = result.reduce((acc, doc) => {
    const dateStr = doc.timestamp.substring(0, 10); // assuming timestamp is ISO string
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(doc);
    return acc;
  }, {} as Record<string, any[]>);

  const dailyResults = [];

  for (const date in groupedByDate) {
    const docs = groupedByDate[date];

    const firstDoc = docs[0];
    const lastDoc = docs[docs.length - 1];

    // Calculate consumption per key based on first and last doc
    const consumption: Record<string, number> = {};

    for (const id of meterIds) {
      for (const suffix of suffixes) {
        const key = `${id}_${suffix}`;
        const firstVal = firstDoc[key] ?? 0;
        const lastVal = lastDoc[key] ?? 0;
        consumption[key] = lastVal - firstVal;
      }
    }

    // Sum groups according to your keys
    const sumGroup = (keys: string[]) =>
      keys.reduce((sum, key) => sum + (consumption[key] || 0), 0);

    const solar = sumGroup(solarKeys);
    const wapda = sumGroup(WapdaKeys);
    const totalConsumption = solar + wapda;

    const compressor1 = consumption[Compressor1Key] || 0;
    const compressor2 = consumption[Compressor2Key] || 0;
    const compressor3 = consumption[Compressor3Key] || 0;
    const totalCompressors = compressor1 + compressor2 + compressor3;

    // const unaccounted = totalConsumption - totalCompressors;
     const losses = totalConsumption - totalCompressors;

   // Define type for daily result
type DailyResult = {
  date: string;
  solar: number;
  wapda: number;
  compressor1: number;
  compressor2: number;
  compressor3: number;
  // total_compressors: number;
  // total_consumption: number;
  // unaccounted_energy: number;
  losses: number;
};


  // ...

  const dailyResults: DailyResult[] = [];

  // ... your grouping and calculation logic ...

  dailyResults.push({
    date,
    solar: +solar.toFixed(5),
    wapda: +wapda.toFixed(5),
    compressor1: +compressor1.toFixed(5),
    compressor2: +compressor2.toFixed(5),
    compressor3: +compressor3.toFixed(5),
    // total_compressors: +totalCompressors.toFixed(5),
    // total_consumption: +totalConsumption.toFixed(5),
    // unaccounted_energy: +unaccounted.toFixed(5),
     losses: +losses.toFixed(2),
  });

  return dailyResults;
}


  // Return array of daily consumption objects
  return dailyResults;
}



async getMonthlyAverages(startDate: string, endDate: string) {
  const db = await this.connect();
  const collection = db.collection('prime_historical_data');

  const startISO = new Date(startDate + 'T00:00:00.000Z');
  const endISO = new Date(endDate + 'T23:59:59.999Z');

  const meterFields = [
    { name: 'solar', field: 'U2_Active_Energy_Total_Consumed' },
    { name: 'wapda', field: 'U1_Active_Energy_Total_Consumed' },
    { name: 'compressor1', field: 'U3_Active_Energy_Total_Consumed' },
    { name: 'compressor2', field: 'U4_Active_Energy_Total_Consumed' },
    { name: 'compressor3', field: 'U5_Active_Energy_Total_Consumed' },
  ];

  const results: any = {};

  for (const meter of meterFields) {
    const pipeline = [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: [{ $toDate: "$timestamp" }, startISO] },
              { $lte: [{ $toDate: "$timestamp" }, endISO] },
            ],
          },
          [meter.field]: { $ne: null },
        },
      },
      {
        $addFields: {
          date: { $toDate: "$timestamp" },
        },
      },
      {
        $addFields: {
          month: {
            $dateTrunc: {
              date: "$date",
              unit: "month",
            },
          },
        },
      },
      {
        $sort: { date: 1 },
      },
      {
        $group: {
          _id: "$month",
          firstDoc: { $first: "$$ROOT" },
          lastDoc: { $last: "$$ROOT" },
        },
      },
      {
        $project: {
          month: "$_id",
          firstValue: `$firstDoc.${meter.field}`,
          lastValue: `$lastDoc.${meter.field}`,
          value: {
            $subtract: [`$lastDoc.${meter.field}`, `$firstDoc.${meter.field}`],
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
          month: monthStr,
          solar: 0,
          wapda: 0,
          compressor1: 0,
          compressor2: 0,
          compressor3: 0,
        };
      }
      results[monthStr][meter.name] = +item.value.toFixed(2);
    }
  }

  const final = Object.values(results).map((entry: any) => {
    const totalCompressors =
      entry.compressor1 + entry.compressor2 + entry.compressor3;
    const totalConsumption = entry.solar + entry.wapda;
    // const unaccounted = totalConsumption - totalCompressors;
    const losses = totalConsumption - totalCompressors;
    return {
      ...entry,
      // total_compressors: +totalCompressors.toFixed(2),
      // total_consumption: +totalConsumption.toFixed(2),
      // unaccounted_energy: +unaccounted.toFixed(2),
       losses: +losses.toFixed(2),
    };
  });

  return final;
}





}

  


  


  

 


  

