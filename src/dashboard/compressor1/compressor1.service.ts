

import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { Getcompressor1Dto } from './dto/get-compressor1.dto';
import * as moment from 'moment';


@Injectable()
export class Compressor1Service{
  private readonly client: MongoClient;
  private readonly dbName = 'iotdb';
  private readonly collectionName = 'prime_historical_data';
  private readonly Compressor2Keys = ['U3_Active_Energy_Total_Consumed'];

  constructor() {
    this.client = new MongoClient('mongodb://admin:cisco123@13.234.241.103:27017/?authSource=iotdb');
  }

  private async getCollection() {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    return db.collection(this.collectionName);
  }




  async handleQuery(query: Getcompressor1Dto) {
    switch (query.value) {
      case 'today':
        return this.getTodayData();
      case 'week':
        return this.getWeekData();
      case 'month':
        return this.getMonthData();
      case 'year':
        return this.getYearData();
      default:
        return { error: 'Invalid value' };
    }
  }

  async getTodayData() {
    const collection = await this.getCollection();

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const matchStage = {
      timestamp: {
        $gte: yesterdayStart.toISOString(),
        $lte: todayEnd.toISOString(),
      },
    };

    const projection: any = { timestamp: 1 };
    this.Compressor2Keys.forEach((key) => (projection[key] = 1));

    const data = await collection
      .aggregate([
        { $match: matchStage },
        { $project: projection },
        { $sort: { timestamp: 1 } },
      ])
      .toArray();

    const firstValues: any = {};
    const lastValues: any = {};

    for (const doc of data) {
      const date = new Date(doc.timestamp);
      const hour = date.getHours().toString().padStart(2, '0') + ':00';
      const type = date.toDateString() === new Date().toDateString() ? 'Today' : 'Yesterday';

      for (const key of this.Compressor2Keys) {
        if (doc[key] != null) {
          firstValues[hour] ??= {};
          lastValues[hour] ??= {};
          firstValues[hour][type] ??= {};
          lastValues[hour][type] ??= {};

          if (firstValues[hour][type][key] == null) {
            firstValues[hour][type][key] = doc[key];
          }
          lastValues[hour][type][key] = doc[key];
        }
      }
    }

    const hourly: any[] = [];
    for (let h = 0; h < 24; h++) {
      const hourStr = h.toString().padStart(2, '0') + ':00';
      let todayTotal = 0;
      let yesterdayTotal = 0;

      for (const key of this.Compressor2Keys) {
        if (
          firstValues?.[hourStr]?.['Today']?.[key] != null &&
          lastValues?.[hourStr]?.['Today']?.[key] != null
        ) {
          todayTotal += lastValues[hourStr]['Today'][key] - firstValues[hourStr]['Today'][key];
        }

        if (
          firstValues?.[hourStr]?.['Yesterday']?.[key] != null &&
          lastValues?.[hourStr]?.['Yesterday']?.[key] != null
        ) {
          yesterdayTotal += lastValues[hourStr]['Yesterday'][key] - firstValues[hourStr]['Yesterday'][key];
        }
      }

      hourly.push({
        Time: hourStr,
        Today: +todayTotal.toFixed(2),
        Yesterday: +yesterdayTotal.toFixed(2),
      });
    }

    return hourly;
  }

  async getWeekData() {
    const collection = await this.getCollection();

    const now = new Date();

    // This week: Monday to today
    const startOfThisWeek = moment().startOf('isoWeek').toDate(); // Monday
    const endOfThisWeek = moment().endOf('isoWeek').toDate();     // Sunday

    // Last week: Monday to Sunday
    const startOfLastWeek = moment().subtract(1, 'weeks').startOf('isoWeek').toDate();
    const endOfLastWeek = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();

    const matchStage = {
      timestamp: {
        $gte: startOfLastWeek.toISOString(),
        $lte: endOfThisWeek.toISOString(),
      },
    };

    const projection: any = { timestamp: 1 };
    this.Compressor2Keys.forEach((key) => (projection[key] = 1));

    const data = await collection
      .aggregate([
        { $match: matchStage },
        { $project: projection },
        { $sort: { timestamp: 1 } },
      ])
      .toArray();

    const firstValues: any = {};
    const lastValues: any = {};

    for (const doc of data) {
      const date = new Date(doc.timestamp);
      const day = moment(date).format('ddd'); // Mon, Tue, etc.
      const weekLabel =
        date >= startOfThisWeek && date <= endOfThisWeek ? 'This Week' : 'Last Week';

      for (const key of this.Compressor2Keys) {
        if (doc[key] != null) {
          firstValues[day] ??= {};
          lastValues[day] ??= {};
          firstValues[day][weekLabel] ??= {};
          lastValues[day][weekLabel] ??= {};

          if (firstValues[day][weekLabel][key] == null) {
            firstValues[day][weekLabel][key] = doc[key];
          }
          lastValues[day][weekLabel][key] = doc[key];
        }
      }
    }

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result: { Day: string; 'This Week': number; 'Last Week': number }[] = [];

    for (const day of daysOfWeek) {
      let thisWeekTotal = 0;
      let lastWeekTotal = 0;

      for (const key of this.Compressor2Keys) {
        if (
          firstValues?.[day]?.['This Week']?.[key] != null &&
          lastValues?.[day]?.['This Week']?.[key] != null
        ) {
          thisWeekTotal += lastValues[day]['This Week'][key] - firstValues[day]['This Week'][key];
        }

        if (
          firstValues?.[day]?.['Last Week']?.[key] != null &&
          lastValues?.[day]?.['Last Week']?.[key] != null
        ) {
          lastWeekTotal += lastValues[day]['Last Week'][key] - firstValues[day]['Last Week'][key];
        }
      }

      result.push({
        Day: day,
        'This Week': +thisWeekTotal.toFixed(2),
        'Last Week': +lastWeekTotal.toFixed(2),
      });
    }

    return result;
  }

  async getYearData() {
    const collection = await this.getCollection();
  
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
  
    const matchStage = {
      timestamp: {
        $gte: `${previousYear}-01-01T00:00:00Z`,
        $lte: `${currentYear}-12-31T23:59:59Z`,
      }
      
    };
  
    const projection: any = { timestamp: 1 };
    this.Compressor2Keys.forEach((key) => (projection[key] = 1));
  
    try {
      const data = await collection.aggregate([
        { $match: matchStage },
        { $project: projection },
        { $sort: { timestamp: 1 } }
      ]).toArray();
  
      const dailyFirstValues: any = {};
      const dailyLastValues: any = {};
  
      data.forEach(doc => {
        const date = new Date(doc.timestamp);
        const dateStr = date.toISOString().slice(0, 10); // yyyy-mm-dd
        const year = date.getFullYear();
  
        if (!dailyFirstValues[year]) dailyFirstValues[year] = {};
        if (!dailyLastValues[year]) dailyLastValues[year] = {};
  
        if (!dailyFirstValues[year][dateStr]) {
          dailyFirstValues[year][dateStr] = {};
        }
        if (!dailyLastValues[year][dateStr]) {
          dailyLastValues[year][dateStr] = {};
        }
  
        this.Compressor2Keys.forEach(key => {
          if (doc[key] != null) {
            if (!(key in dailyFirstValues[year][dateStr])) {
              dailyFirstValues[year][dateStr][key] = doc[key];
            }
            dailyLastValues[year][dateStr][key] = doc[key];
          }
        });
      });
  
      // Calculate daily consumption and add to monthly totals
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
      const yearlyConsumption: any = {
        [currentYear]: Object.fromEntries(months.map(m => [m, 0])),
        [previousYear]: Object.fromEntries(months.map(m => [m, 0]))
      };
  
      Object.keys(dailyFirstValues).forEach(yearStr => {
        const year = parseInt(yearStr);
        Object.keys(dailyFirstValues[year]).forEach(dateStr => {
          const date = new Date(dateStr);
          const month = moment(date).format('MMM');
  
          let dailyTotal = 0;
          this.Compressor2Keys.forEach(key => {
            const first = dailyFirstValues[year][dateStr][key];
            const last = dailyLastValues[year][dateStr][key];
            if (first != null && last != null) {
              dailyTotal += last - first;
            }
          });
  
          yearlyConsumption[year][month] += dailyTotal;
        });
      });
  
      const output = months.map(month => ({
        Month: month,
        "Current Year": this.formatNumber(yearlyConsumption[currentYear][month]),
        "Previous Year": this.formatNumber(yearlyConsumption[previousYear][month]),
      }));
  
      return output;
  
    } catch (error) {
      console.error('Error fetching data:', error);
      throw new Error(`Error fetching data: ${error.message}`);
    }
  }
  
  // Helper function for formatting
  formatNumber(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  async getMonthData() {
    const collection = await this.getCollection();

    const now = new Date();
    const startOfThisMonth = moment().startOf('month').toDate();
    const endOfThisMonth = moment().endOf('month').toDate();

    const startOfLastMonth = moment().subtract(1, 'months').startOf('month').toDate();
    const endOfLastMonth = moment().subtract(1, 'months').endOf('month').toDate();

    const matchStage = {
        timestamp: {
            $gte: startOfLastMonth.toISOString(),
            $lte: endOfThisMonth.toISOString(),
        },
    };

    const projection: any = { timestamp: 1 };
    this.Compressor2Keys.forEach((key) => (projection[key] = 1));

    const data = await collection
        .aggregate([
            { $match: matchStage },
            { $project: projection },
            { $sort: { timestamp: 1 } },
        ])
        .toArray();

    const dailyConsumption: any = {};

    for (const doc of data) {
        const date = new Date(doc.timestamp);
        const formattedDate = moment(date).format('YYYY-MM-DD');

        if (!dailyConsumption[formattedDate]) {
            dailyConsumption[formattedDate] = {};
        }

        for (const key of this.Compressor2Keys) {
            if (doc[key] != null) {
                if (!dailyConsumption[formattedDate][key]) {
                    dailyConsumption[formattedDate][key] = { first: null, last: null };
                }

                if (dailyConsumption[formattedDate][key].first === null) {
                    dailyConsumption[formattedDate][key].first = doc[key];
                }

                dailyConsumption[formattedDate][key].last = doc[key];
            }
        }
    }

    const weeks = [
        { name: "Week1", start: 1, end: 7 },
        { name: "Week2", start: 8, end: 14 },
        { name: "Week3", start: 15, end: 21 },
        { name: "Week4", start: 22, end: 28 },
        { name: "Week5", start: 29, end: 31 },
    ];

    const weekData = weeks.reduce((acc, week) => {
        acc[week.name] = { 'This Month': 0, 'Last Month': 0 };
        return acc;
    }, {} as any);

    const addToWeekData = (dateStr: string, consumption: number, monthType: string) => {
        const dateObj = new Date(dateStr);
        const day = dateObj.getDate();
        const week = weeks.find((w) => day >= w.start && day <= w.end);
        if (week) {
            weekData[week.name][monthType] += consumption;
        }
    };

    for (const date in dailyConsumption) {
        const dateData = dailyConsumption[date];
        let totalConsumption = 0;

        for (const key of this.Compressor2Keys) {
            const keyData = dateData[key];
            if (keyData && keyData.first != null && keyData.last != null) {
                totalConsumption += keyData.last - keyData.first;
            }
        }

        const dateObj = new Date(date);
        if (dateObj >= startOfThisMonth && dateObj <= endOfThisMonth) {
            addToWeekData(date, totalConsumption, 'This Month');
        }

        if (dateObj >= startOfLastMonth && dateObj <= endOfLastMonth) {
            addToWeekData(date, totalConsumption, 'Last Month');
        }
    }

    const output = weeks.map((week) => ({
        Weeks: week.name,
        'This Month': +weekData[week.name]['This Month'].toFixed(2),
        'Last Month': +weekData[week.name]['Last Month'].toFixed(2),
    }));

    return output;
}

  
}
