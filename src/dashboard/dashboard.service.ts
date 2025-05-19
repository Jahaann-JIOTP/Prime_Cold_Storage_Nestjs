import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateTime } from 'luxon';

@Injectable()
export class DashboardService {
  
constructor(
    @InjectModel('prime_historical_data') private readonly dashboardModel: Model<any>,
  ) {}
  

  async getConsumption(startDate: string, endDate: string) {
    const meterIds = [
      "U2", "U1",
    ];
    const suffixes = ["Active_Energy_Total_Consumed", "Active_Energy_Total_Supplied", "Active_Energy_Total"];
    const solarKeys = ["U2_Active_Energy_Total"];
    const wapdaImportKeys = ["U1_Active_Energy_Total_Consumed"];
    const wapdaExportKeys = ["U1_Active_Energy_Total_Supplied"];
    

    const startISO = new Date(`${startDate}T00:00:00.000+05:00`);
    const endISO = new Date(`${endDate}T23:59:59.999+05:00`);

    const projection: any = { timestamp: 1 };
    meterIds.forEach((id) => {
      suffixes.forEach((suf) => {
        projection[`${id}_${suf}`] = 1;
      });
    });

    const rawData = await this.dashboardModel.aggregate([
      { $match: { timestamp: { $gte: startISO.toISOString(), $lte: endISO.toISOString() } } },
      { $project: projection },
      { $sort: { timestamp: 1 } },
    ]);

    const dailyConsumption = {};
    const firstValues = {};
    const lastValues = {};

    rawData.forEach((doc) => {
      const date = new Date(doc.timestamp).toISOString().slice(0, 10);
      meterIds.forEach((id) => {
        suffixes.forEach((suf) => {
          const key = `${id}_${suf}`;
          const val = doc[key];
          if (val !== undefined) {
            firstValues[date] ??= {};
            lastValues[date] ??= {};
            if (!(key in firstValues[date])) firstValues[date][key] = val;
            lastValues[date][key] = val;
          }
        });
      });
    });

    const dates = Object.keys(firstValues).sort();
    dates.forEach((date, i) => {
      const next = dates[i + 1];
      if (!next) return;
      dailyConsumption[date] = {};
      meterIds.forEach((id) => {
        suffixes.forEach((suf) => {
          const key = `${id}_${suf}`;
          if (
            firstValues[next]?.[key] !== undefined &&
            firstValues[date]?.[key] !== undefined
          ) {
            dailyConsumption[date][key] =
              firstValues[next][key] - firstValues[date][key];
          }
        });
      });
    });

    const lastDate = dates.at(-1);
    if (lastDate) {
      dailyConsumption[lastDate] = {};
      meterIds.forEach((id) => {
        suffixes.forEach((suf) => {
          const key = `${id}_${suf}`;
          const start = firstValues[lastDate]?.[key];
          const end = lastValues[lastDate]?.[key];
          if (start !== undefined && end !== undefined) {
            dailyConsumption[lastDate][key] = end - start;
          }
        });
      });
    }

    const total = {
      Solars: 0,
      wapda_Import: 0,
      wapda_Export: 0,
      
    };

    Object.values(dailyConsumption).forEach((day: any) => {
      Object.entries(day).forEach(([key, value]) => {
        if (solarKeys.includes(key)) total.Solars += Number(value) || 0;
        else if (wapdaImportKeys.includes(key)) total.wapda_Import += Number(value) || 0;
        else if (wapdaExportKeys.includes(key)) total.wapda_Export += Number(value) || 0;
       
      });
    });

    

    return { total_consumption: total };
  }
  // async getTodayData(): Promise<any> {
  //   // Set the start and end of today and yesterday in UTC
  //   const today = DateTime.utc().startOf('day');
  //   const todayEnd = today.endOf('day');

  //   const yesterday = today.minus({ days: 1 });
  //   const yesterdayEnd = yesterday.endOf('day');

  //   // Solar keys to fetch
  //   const solarKeys = [
  //     'G2_U20_ACTIVE_ENERGY_IMPORT_KWH',
  //     'U_27_ACTIVE_ENERGY_IMPORT_KWH',
  //   ];

  //   try {
  //     // Log the date range for debugging purposes
  //     console.log('Today Start:', today.toJSDate());
  //     console.log('Today End:', todayEnd.toJSDate());
  //     console.log('Yesterday Start:', yesterday.toJSDate());
  //     console.log('Yesterday End:', yesterdayEnd.toJSDate());

  //     // Fetch data for today
  //     const todayData = await this.dashboardModel.aggregate([
  //       { $match: { timestamp: { $gte: today.toJSDate(), $lte: todayEnd.toJSDate() } } },
  //       { $project: { timestamp: 1, ...this.createProjection(solarKeys) } },
  //       { $sort: { timestamp: 1 } },
  //     ]);

  //     // Fetch data for yesterday
  //     const yesterdayData = await this.dashboardModel.aggregate([
  //       { $match: { timestamp: { $gte: yesterday.toJSDate(), $lte: yesterdayEnd.toJSDate() } } },
  //       { $project: { timestamp: 1, ...this.createProjection(solarKeys) } },
  //       { $sort: { timestamp: 1 } },
  //     ]);

  //     // Log the retrieved data for today and yesterday
  //     console.log('Today Data:', todayData);
  //     console.log('Yesterday Data:', yesterdayData);

  //     // Process the data
  //     const todayValues = this.processData(todayData, solarKeys);
  //     const yesterdayValues = this.processData(yesterdayData, solarKeys);

  //     // Log the processed values
  //     console.log('Processed Today Values:', todayValues);
  //     console.log('Processed Yesterday Values:', yesterdayValues);

  //     // Calculate hourly consumption for both today and yesterday
  //     const hourlyConsumption: any[] = [];

  //     for (let hour = 0; hour < 24; hour++) {
  //       const hourStr = String(hour).padStart(2, '0') + ":00";
  //       let totalToday = 0;
  //       let totalYesterday = 0;

  //       solarKeys.forEach((key) => {
  //         if (
  //           todayValues.firstValues[hourStr] &&
  //           todayValues.lastValues[hourStr] &&
  //           todayValues.firstValues[hourStr][key] !== undefined &&
  //           todayValues.lastValues[hourStr][key] !== undefined
  //         ) {
  //           totalToday += todayValues.lastValues[hourStr][key] - todayValues.firstValues[hourStr][key];
  //         }

  //         if (
  //           yesterdayValues.firstValues[hourStr] &&
  //           yesterdayValues.lastValues[hourStr] &&
  //           yesterdayValues.firstValues[hourStr][key] !== undefined &&
  //           yesterdayValues.lastValues[hourStr][key] !== undefined
  //         ) {
  //           totalYesterday += yesterdayValues.lastValues[hourStr][key] - yesterdayValues.firstValues[hourStr][key];
  //         }
  //       });

  //       hourlyConsumption.push({
  //         Time: hourStr,
  //         Today: this.round(totalToday, 2),
  //         Yesterday: this.round(totalYesterday, 2),
  //       });
  //     }

  //     // Return hourly consumption data
  //     return hourlyConsumption;

  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //     throw new Error('Error fetching data: ' + error.message);
  //   }
  // }

  // // Helper function to create projection dynamically
  // createProjection(keys: string[]): any {
  //   const projection: any = { timestamp: 1 };
  //   keys.forEach((key) => {
  //     projection[key] = 1;
  //   });
  //   return projection;
  // }

  // // Process the data to get first and last values for each hour
  // processData(data: any[], keys: string[]): any {
  //   const firstValues: any = {};
  //   const lastValues: any = {};

  //   data.forEach((document) => {
  //     const dateTime = DateTime.fromJSDate(document.timestamp);
  //     const hour = dateTime.toFormat('HH:00');

  //     if (!firstValues[hour]) firstValues[hour] = {};
  //     if (!lastValues[hour]) lastValues[hour] = {};

  //     keys.forEach((key) => {
  //       if (document[key] !== undefined) {
  //         if (!firstValues[hour][key]) {
  //           firstValues[hour][key] = document[key];
  //         }
  //         lastValues[hour][key] = document[key];
  //       }
  //     });
  //   });

  //   return { firstValues, lastValues };
  // }

  // // Helper function to round values to 2 decimal places
  // round(value: number, decimals: number): number {
  //   return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
  // }
}