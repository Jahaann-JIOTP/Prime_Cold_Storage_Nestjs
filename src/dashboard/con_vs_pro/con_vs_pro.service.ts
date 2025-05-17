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

  // Proper Date range setup
  const startISO = new Date(startDate + 'T00:00:00.000Z');
  const endISO = new Date(endDate + 'T23:59:59.999Z');

  const pipeline = [
    // 1. Filter only between the given date range using proper date conversion
    {
      $match: {
        $expr: {
          $and: [
            { $gte: [{ $dateFromString: { dateString: "$timestamp" } }, startISO] },
            { $lte: [{ $dateFromString: { dateString: "$timestamp" } }, endISO] }
          ]
        }
      }
    },
    // 2. Convert timestamp string to date object
    {
      $addFields: {
        date: { $dateFromString: { dateString: '$timestamp' } },
      }
    },
    // 3. Extract year, month, day, hour
    {
      $addFields: {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
        hour: { $hour: '$date' },
      }
    },
    // 4. Sort by date for correct $first and $last behavior
    {
      $sort: { date: 1 },
    },
    // 5. Group by year-month-day-hour
    {
      $group: {
        _id: {
          year: '$year',
          month: '$month',
          day: '$day',
          hour: '$hour',
        },
        first_solar: { $first: '$U2_Total_Active_Power' },
        last_solar: { $last: '$U2_Total_Active_Power' },

        first_wapda: { $first: '$U1_Total_Active_Power' },
        last_wapda: { $last: '$U1_Total_Active_Power' },

        first_consumption1: { $first: '$U3_Total_Active_Power' },
        last_consumption1: { $last: '$U3_Total_Active_Power' },

        first_consumption2: { $first: '$U4_Total_Active_Power' },
        last_consumption2: { $last: '$U4_Total_Active_Power' },

        first_consumption3: { $first: '$U5_Total_Active_Power' },
        last_consumption3: { $last: '$U5_Total_Active_Power' },
      },
    },
    // 6. Sort again by date parts
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
        '_id.day': 1,
        '_id.hour': 1,
      },
    },
  ];

  const data = await collection.aggregate(pipeline).toArray();

  // Map the grouped data into final format
  const results = data.map((entry) => {
    const solar = (entry.last_solar || 0) - (entry.first_solar || 0);
    const wapda = (entry.last_wapda || 0) - (entry.first_wapda || 0);
    const comp1 = (entry.last_consumption1 || 0) - (entry.first_consumption1 || 0);
    const comp2 = (entry.last_consumption2 || 0) - (entry.first_consumption2 || 0);
    const comp3 = (entry.last_consumption3 || 0) - (entry.first_consumption3 || 0);

    const sum_compressors = comp1 + comp2 + comp3;
    const total_input = solar + wapda;
    const losses = total_input - sum_compressors;

    return {
      date: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}-${String(entry._id.day).padStart(2, '0')} ${String(entry._id.hour).padStart(2, '0')}:00:00`,
      solar: +solar.toFixed(2),
      wapda: +wapda.toFixed(2),
      consumption1: +comp1.toFixed(2),
      consumption2: +comp2.toFixed(2),
      consumption3: +comp3.toFixed(2),
      losses: +losses.toFixed(2),
    };
  });

  return results;
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
async getDailyPowerAverages(startDate: string, endDate: string) {
  const db = await this.connect();  // Your MongoDB connection method
  const collection = db.collection('prime_historical_data');

  // Convert input dates to ISO strings for accurate range filtering
  const startISO = new Date(startDate + 'T00:00:00.000Z');
  const endISO = new Date(endDate + 'T23:59:59.999Z');

  const pipeline = [
    {
      // Use $expr and $dateFromString to compare timestamp strings as dates
      $match: {
        $expr: {
          $and: [
            { $gte: [{ $dateFromString: { dateString: "$timestamp" } }, startISO] },
            { $lte: [{ $dateFromString: { dateString: "$timestamp" } }, endISO] },
          ],
        },
      },
    },
    {
      $addFields: {
        date: { $dateFromString: { dateString: '$timestamp' } },
      },
    },
    {
      $addFields: {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
      },
    },
    {
      $sort: { date: 1 },
    },
    {
      $group: {
        _id: { year: '$year', month: '$month', day: '$day' },

        first_solar: { $first: '$U2_Total_Active_Power' },
        last_solar: { $last: '$U2_Total_Active_Power' },

        first_wapda: { $first: '$U1_Total_Active_Power' },
        last_wapda: { $last: '$U1_Total_Active_Power' },

        first_consumption1: { $first: '$U3_Total_Active_Power' },
        last_consumption1: { $last: '$U3_Total_Active_Power' },

        first_consumption2: { $first: '$U4_Total_Active_Power' },
        last_consumption2: { $last: '$U4_Total_Active_Power' },

        first_consumption3: { $first: '$U5_Total_Active_Power' },
        last_consumption3: { $last: '$U5_Total_Active_Power' },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
        '_id.day': 1,
      },
    },
  ];

  const data = await collection.aggregate(pipeline).toArray();

  // Map aggregation results into desired output format
  const results = data.map((entry) => {
    const solar_consumption = (entry.last_solar || 0) - (entry.first_solar || 0);
    const wapda_consumption = (entry.last_wapda || 0) - (entry.first_wapda || 0);
    const consumption1 = (entry.last_consumption1 || 0) - (entry.first_consumption1 || 0);
    const consumption2 = (entry.last_consumption2 || 0) - (entry.first_consumption2 || 0);
    const consumption3 = (entry.last_consumption3 || 0) - (entry.first_consumption3 || 0);

    const sum_of_compressors = consumption1 + consumption2 + consumption3;
    const total_load = solar_consumption + wapda_consumption;
    const losses = total_load - sum_of_compressors;

    return {
      date: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}-${String(entry._id.day).padStart(2, '0')}`,
      solar: +solar_consumption.toFixed(2),
      wapda: +wapda_consumption.toFixed(2),
      consumption1: +consumption1.toFixed(2),
      consumption2: +consumption2.toFixed(2),
      consumption3: +consumption3.toFixed(2),
      losses: +losses.toFixed(2),
    };
  });

  return results;
}




 async getMonthlyAverages(startDate: string, endDate: string) {
  const db = await this.connect();
  const collection = db.collection('prime_historical_data');

  // Convert dates to ISO format (if your timestamps are in ISO format)
  const startISO = new Date(startDate + 'T00:00:00.000Z').toISOString();
  const endISO = new Date(endDate + 'T23:59:59.999Z').toISOString();

  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startISO, $lte: endISO }
      }
    },
    {
      $addFields: {
        date: { $dateFromString: { dateString: '$timestamp' } }
      }
    },
    {
      $addFields: {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' }
      }
    },
    {
      $sort: { date: 1 }
    },
    // Group by year, month, day to get first and last reading of each day
    {
      $group: {
        _id: { year: '$year', month: '$month', day: '$day' },

        first_solar: { $first: '$U2_Total_Active_Power' },
        last_solar: { $last: '$U2_Total_Active_Power' },

        first_wapda: { $first: '$U1_Total_Active_Power' },
        last_wapda: { $last: '$U1_Total_Active_Power' },

        first_consumption1: { $first: '$U3_Total_Active_Power' },
        last_consumption1: { $last: '$U3_Total_Active_Power' },

        first_consumption2: { $first: '$U4_Total_Active_Power' },
        last_consumption2: { $last: '$U4_Total_Active_Power' },

        first_consumption3: { $first: '$U5_Total_Active_Power' },
        last_consumption3: { $last: '$U5_Total_Active_Power' }
      }
    },
    // Now group by year and month to sum daily differences for the month
    {
      $group: {
        _id: { year: '$_id.year', month: '$_id.month' },

        solar_sum: {
          $sum: { $subtract: ['$last_solar', '$first_solar'] }
        },
        wapda_sum: {
          $sum: { $subtract: ['$last_wapda', '$first_wapda'] }
        },
        consumption1_sum: {
          $sum: { $subtract: ['$last_consumption1', '$first_consumption1'] }
        },
        consumption2_sum: {
          $sum: { $subtract: ['$last_consumption2', '$first_consumption2'] }
        },
        consumption3_sum: {
          $sum: { $subtract: ['$last_consumption3', '$first_consumption3'] }
        }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    }
  ];

  const data = await collection.aggregate(pipeline).toArray();

  // Format the output nicely
  const results = data.map(entry => {
    const solar = entry.solar_sum || 0;
    const wapda = entry.wapda_sum || 0;
    const consumption1 = entry.consumption1_sum || 0;
    const consumption2 = entry.consumption2_sum || 0;
    const consumption3 = entry.consumption3_sum || 0;

    const sum_of_compressors = consumption1 + consumption2 + consumption3;
    const total_load = solar + wapda;
    const losses = total_load - sum_of_compressors;

    return {
      date: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`,
      solar: +solar.toFixed(2),
      wapda: +wapda.toFixed(2),
      consumption1: +consumption1.toFixed(2),
      consumption2: +consumption2.toFixed(2),
      consumption3: +consumption3.toFixed(2),
      losses: +losses.toFixed(2)
    };
  });

  return results;
}


}

  


  


  

 


  

