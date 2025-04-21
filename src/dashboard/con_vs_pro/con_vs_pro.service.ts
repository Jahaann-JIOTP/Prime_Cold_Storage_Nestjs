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
    const collection = db.collection('GCL_new');

    const pipeline = [
      {
        $match: {
          PLC_DATE_TIME: {
            $gte: 'DT#' + startDate + '-00:00:00',
            $lte: 'DT#' + endDate + '-23:59:59'
          }
        }
      },
      {
        $project: {
          G2_U20_ACTIVE_POWER_TOTAL_KW: 1,
          U_27_ACTIVE_POWER_TOTAL_KW: 1,
          U_24_ACTIVE_POWER_TOTAL_KW: 1,
          U_25_ACTIVE_POWER_TOTAL_KW: { $abs: '$U_25_ACTIVE_POWER_TOTAL_KW' },
          G1_U16_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U17_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U18_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U19_ACTIVE_POWER_TOTAL_KW: 1,
          PLC_DATE_TIME: 1,
          date: {
            $dateFromString: { dateString: { $substr: ['$PLC_DATE_TIME', 3, 19] } }
          }
        }
      },
      {
        $addFields: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          hour: { $hour: '$date' },
          minute: { $minute: '$date' }
        }
      },
      {
        $match: {
          minute: { $mod: [15, 0] }
        }
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
            day: '$day',
            hour: '$hour'
          },
          avg_G2_U20: { $avg: '$G2_U20_ACTIVE_POWER_TOTAL_KW' },
          avg_U_27: { $avg: '$U_27_ACTIVE_POWER_TOTAL_KW' },
          avg_U_24: { $avg: '$U_24_ACTIVE_POWER_TOTAL_KW' },
          avg_U_25: { $avg: '$U_25_ACTIVE_POWER_TOTAL_KW' },
          avg_G1_U16: { $avg: '$G1_U16_ACTIVE_POWER_TOTAL_KW' },
          avg_G1_U17: { $avg: '$G1_U17_ACTIVE_POWER_TOTAL_KW' },
          avg_G1_U18: { $avg: '$G1_U18_ACTIVE_POWER_TOTAL_KW' },
          avg_G1_U19: { $avg: '$G1_U19_ACTIVE_POWER_TOTAL_KW' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
          '_id.hour': 1
        }
      }
    ];

    const data = await collection.aggregate(pipeline).toArray();
    const results = data.map(entry => {
      const {
        avg_G2_U20,
        avg_U_27,
        avg_U_24,
        avg_U_25,
        avg_G1_U16,
        avg_G1_U17,
        avg_G1_U18,
        avg_G1_U19
      } = entry;
    
      const sum_avg_G2_U20_and_U_27 = (avg_G2_U20 || 0) + (avg_U_27 || 0);
      const sum_avg_G1s = (avg_G1_U16 || 0) + (avg_G1_U17 || 0) + (avg_G1_U18 || 0) + (avg_G1_U19 || 0);
      const sum_avg_U_24_and_U_25 = ((avg_U_24 || 0) + (avg_U_25 || 0)) / 1000;
      const vfd_motor = sum_avg_U_24_and_U_25;
      const total_load = +(sum_avg_G2_U20_and_U_27 + sum_avg_U_24_and_U_25).toFixed(2);
      const solarUsage = total_load !== 0
        ? +((sum_avg_G2_U20_and_U_27 / total_load) * 100).toFixed(2)
        : 0;
      const losses = +(total_load - vfd_motor).toFixed(2);
    
      const year = entry._id.year;
      const month = String(entry._id.month).padStart(2, '0');
      const day = String(entry._id.day).padStart(2, '0');
      const hour = String(entry._id.hour).padStart(2, '0');
    
      const fullDateTime = `${year}-${month}-${day} ${hour}:00:00`;
    
      return {
        date: fullDateTime,
        // avg_G2_U20_ACTIVE_POWER_TOTAL_KW: +(avg_G2_U20 || 0).toFixed(2),
        // avg_U_27_ACTIVE_POWER_TOTAL_KW: +(avg_U_27 || 0).toFixed(2),
        // sum_avg_G2_U20_and_U_27: +sum_avg_G2_U20_and_U_27.toFixed(2),
        // sum_avg_G1_U16_and_G1_U17_and_G1_U18_and_G1_U19: +sum_avg_G1s.toFixed(2),
        // avg_U_24_ACTIVE_POWER_TOTAL_KW: +(avg_U_24 || 0).toFixed(3),
        // avg_U_25_ACTIVE_POWER_TOTAL_KW: +(avg_U_25 || 0).toFixed(3),
        // sum_avg_U_24_and_U_25: +sum_avg_U_24_and_U_25.toFixed(2),
        // solar_usage: solarUsage,
        vfd_motor: +vfd_motor.toFixed(2),
        total_load,
        losses
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
    const db = await this.connect();
    const collection = db.collection('GCL_new');
  
    const pipeline = [
      {
        $match: {
          PLC_DATE_TIME: {
            $gte: 'DT#' + startDate + '-00:00:00',
            $lte: 'DT#' + endDate + '-23:59:59'
          }
        }
      },
      {
        $project: {
          G2_U20_ACTIVE_POWER_TOTAL_KW: 1,
          U_27_ACTIVE_POWER_TOTAL_KW: 1,
          U_24_ACTIVE_POWER_TOTAL_KW: 1,
          U_25_ACTIVE_POWER_TOTAL_KW: { $abs: '$U_25_ACTIVE_POWER_TOTAL_KW' },
          G1_U16_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U17_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U18_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U19_ACTIVE_POWER_TOTAL_KW: 1,
          PLC_DATE_TIME: 1,
          date: {
            $dateFromString: { dateString: { $substr: ['$PLC_DATE_TIME', 3, 19] } }
          }
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
        $group: {
          _id: {
            year: '$year',
            month: '$month',
            day: '$day'
          },
          total_G2_U20: { $sum: '$G2_U20_ACTIVE_POWER_TOTAL_KW' },
          total_U_27: { $sum: '$U_27_ACTIVE_POWER_TOTAL_KW' },
          total_U_24: { $sum: '$U_24_ACTIVE_POWER_TOTAL_KW' },
          total_U_25: { $sum: '$U_25_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U16: { $sum: '$G1_U16_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U17: { $sum: '$G1_U17_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U18: { $sum: '$G1_U18_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U19: { $sum: '$G1_U19_ACTIVE_POWER_TOTAL_KW' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ];
  
    const data = await collection.aggregate(pipeline).toArray();
  
    const results = data.map(entry => {
      const {
        total_G2_U20,
        total_U_27,
        total_U_24,
        total_U_25,
        total_G1_U16,
        total_G1_U17,
        total_G1_U18,
        total_G1_U19,
        count
      } = entry;
    
      const dateStr = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}-${String(entry._id.day).padStart(2, '0')}`;
    
      const avg = (value) => +(value / count).toFixed(2);
    
      // Averages
      const avg_G2_U20 = avg(total_G2_U20);
      const avg_U_27 = avg(total_U_27);
      const avg_U_24 = avg(total_U_24);
      const avg_U_25 = avg(total_U_25);
      const avg_G1_U16 = avg(total_G1_U16);
      const avg_G1_U17 = avg(total_G1_U17);
      const avg_G1_U18 = avg(total_G1_U18);
      const avg_G1_U19 = avg(total_G1_U19);
    
      // Sums
      const sum_avg_G2_U20_and_U_27 = +(total_G2_U20 + total_U_27).toFixed(2); // solar
      const sum_avg_U_24_and_U_25 = +((total_U_24 + total_U_25) / 1000).toFixed(2); // WAPDA (also used for VFD)
      const sum_avg_G1s = +((total_G1_U16 + total_G1_U17 + total_G1_U18 + total_G1_U19) / 1000).toFixed(2); // generator
    
      // Final Calculations
      const total_load = +(sum_avg_G2_U20_and_U_27 + sum_avg_U_24_and_U_25).toFixed(2); // ✅ total load
      const vfd_motor = sum_avg_U_24_and_U_25; // ✅ as per your naming
      const losses = +(total_load - vfd_motor).toFixed(2); // ✅ correct loss formula
    
      const solarUsage = (sum_avg_G2_U20_and_U_27 + sum_avg_U_24_and_U_25 + sum_avg_G1s) !== 0
        ? +((sum_avg_G2_U20_and_U_27 / (sum_avg_G2_U20_and_U_27 + sum_avg_U_24_and_U_25 + sum_avg_G1s)) * 100).toFixed(2)
        : 0;
    
      return {
        date: dateStr,
        // avg_G2_U20_ACTIVE_POWER_TOTAL_KW: avg_G2_U20,
        // avg_U_27_ACTIVE_POWER_TOTAL_KW: avg_U_27,
        // sum_avg_G2_U20_and_U_27,
        // avg_U_24_ACTIVE_POWER_TOTAL_KW: avg_U_24,
        // avg_U_25_ACTIVE_POWER_TOTAL_KW: avg_U_25,
        // sum_avg_U_24_and_U_25,
       
        // avg_G1_U16_ACTIVE_POWER_TOTAL_KW: avg_G1_U16,
        // avg_G1_U17_ACTIVE_POWER_TOTAL_KW: avg_G1_U17,
        // avg_G1_U18_ACTIVE_POWER_TOTAL_KW: avg_G1_U18,
        // avg_G1_U19_ACTIVE_POWER_TOTAL_KW: avg_G1_U19,
        // sum_avg_G1_U16_and_G1_U17_and_G1_U18_and_G1_U19: sum_avg_G1s,
       
        // solar_usage: solarUsage,
        losses,
        vfd_motor, 
        total_load, 
      };
    });
    
    return results;
    
  }

  async getMonthlyAverages(startDate: string, endDate: string) {
    const db = await this.connect();
    const collection = db.collection('GCL_new');

    const pipeline = [
      {
        $match: {
          PLC_DATE_TIME: {
            $gte: 'DT#' + startDate + '-00:00:00',
            $lte: 'DT#' + endDate + '-23:59:59',
          }
        }
      },
      {
        $project: {
          G2_U20_ACTIVE_POWER_TOTAL_KW: 1,
          U_27_ACTIVE_POWER_TOTAL_KW: 1,
          U_24_ACTIVE_POWER_TOTAL_KW: 1,
          U_25_ACTIVE_POWER_TOTAL_KW: { $abs: '$U_25_ACTIVE_POWER_TOTAL_KW' },
          G1_U16_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U17_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U18_ACTIVE_POWER_TOTAL_KW: 1,
          G1_U19_ACTIVE_POWER_TOTAL_KW: 1,
          PLC_DATE_TIME: 1,
          date: { $dateFromString: { dateString: { $substr: ['$PLC_DATE_TIME', 3, 19] } } }
        }
      },
      {
        $addFields: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          total_G2_U20: { $sum: '$G2_U20_ACTIVE_POWER_TOTAL_KW' },
          total_U_27: { $sum: '$U_27_ACTIVE_POWER_TOTAL_KW' },
          total_U_24: { $sum: '$U_24_ACTIVE_POWER_TOTAL_KW' },
          total_U_25: { $sum: '$U_25_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U16: { $sum: '$G1_U16_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U17: { $sum: '$G1_U17_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U18: { $sum: '$G1_U18_ACTIVE_POWER_TOTAL_KW' },
          total_G1_U19: { $sum: '$G1_U19_ACTIVE_POWER_TOTAL_KW' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ];

    const data = await collection.aggregate(pipeline).toArray();

    const results = data.map(entry => {
      const {
        total_G2_U20,
        total_U_27,
        total_U_24,
        total_U_25,
        total_G1_U16,
        total_G1_U17,
        total_G1_U18,
        total_G1_U19,
        count
      } = entry;
    
      const dateStr = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`;
    
      const avg = (value: number) => +(value / count).toFixed(2);
    
      // Average values
      const avg_G2_U20 = avg(total_G2_U20);
      const avg_U_27 = avg(total_U_27);
      const avg_U_24 = avg(total_U_24);
      const avg_U_25 = avg(total_U_25);
      const avg_G1_U16 = avg(total_G1_U16);
      const avg_G1_U17 = avg(total_G1_U17);
      const avg_G1_U18 = avg(total_G1_U18);
      const avg_G1_U19 = avg(total_G1_U19);
    
      // Sums
      const sum_avg_G2_U20_and_U_27 = +(total_G2_U20 + total_U_27).toFixed(2); // in kW
      const sum_avg_U_24_and_U_25 = +((total_U_24 + total_U_25) / 1000).toFixed(2); // in MW
      const sum_avg_G1s = +((total_G1_U16 + total_G1_U17 + total_G1_U18 + total_G1_U19) / 1000).toFixed(2); // in MW
    
      // Custom Logic
      const total_load = +(sum_avg_G2_U20_and_U_27 + sum_avg_U_24_and_U_25).toFixed(2); // in MW (G2+U27 in kW + U24+U25 in MW)
      const vfd_motor = sum_avg_U_24_and_U_25; // already in MW
      const losses = +(total_load - vfd_motor).toFixed(2); // in MW
    
      // Optional: Solar usage logic (if still needed)
      const solarUsage = (sum_avg_G2_U20_and_U_27 + sum_avg_U_24_and_U_25 + sum_avg_G1s) !== 0
        ? +((sum_avg_G2_U20_and_U_27 / (sum_avg_G2_U20_and_U_27 + sum_avg_U_24_and_U_25 + sum_avg_G1s)) * 100).toFixed(2)
        : 0;
    
      return {
        date: dateStr,
        // avg_G2_U20_ACTIVE_POWER_TOTAL_KW: avg_G2_U20,
        // avg_U_27_ACTIVE_POWER_TOTAL_KW: avg_U_27,
        // sum_avg_G2_U20_and_U_27,
        // avg_U_24_ACTIVE_POWER_TOTAL_KW: avg_U_24,
        // avg_U_25_ACTIVE_POWER_TOTAL_KW: avg_U_25,
        // sum_avg_U_24_and_U_25,
        // avg_G1_U16_ACTIVE_POWER_TOTAL_KW: avg_G1_U16,
        // avg_G1_U17_ACTIVE_POWER_TOTAL_KW: avg_G1_U17,
        // avg_G1_U18_ACTIVE_POWER_TOTAL_KW: avg_G1_U18,
        // avg_G1_U19_ACTIVE_POWER_TOTAL_KW: avg_G1_U19,
        // sum_avg_G1_U16_and_G1_U17_and_G1_U18_and_G1_U19: sum_avg_G1s,
        // solar_usage: solarUsage,
        total_load,
        vfd_motor,
        losses
        
      };
    });
    
    return results;
    
  }
}

  


  


  

 


  

