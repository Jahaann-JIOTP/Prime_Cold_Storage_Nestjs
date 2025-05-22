
import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { Getcompressor2Dto } from './dto/get-compressor.dto';
import * as moment from 'moment';


@Injectable()
export class Compressor2Service{
  private readonly client: MongoClient;
  private readonly dbName = 'iotdb';
  private readonly collectionName = 'prime_historical_data';
  private readonly Compressor2Keys = ['U4_Active_Energy_Total_Consumed'];

  constructor() {
    this.client = new MongoClient('mongodb://admin:cisco123@13.234.241.103:27017/?authSource=iotdb');
  }

  private async getCollection() {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    return db.collection(this.collectionName);
  }




  async handleQuery(query: Getcompressor2Dto) {
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

  const now = moment().tz("Asia/Karachi");

  const todayStart = now.clone().startOf('day'); // 00:00:00 Asia/Karachi
  const todayEnd = now.clone().endOf('day');     // 23:59:59 Asia/Karachi
  const yesterdayStart = todayStart.clone().subtract(1, 'day'); // 00:00:00 of yesterday

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

  // Convert to moment in Asia/Karachi for consistent time zone handling
  data.forEach((doc) => {
    doc._moment = moment(doc.timestamp).tz("Asia/Karachi");
  });

  function getHourBoundaries(startMoment: moment.Moment): moment.Moment[] {
    const boundaries: moment.Moment[] = [];
    for (let h = 0; h <= 24; h++) {
      boundaries.push(startMoment.clone().startOf('day').add(h, 'hours'));
    }
    return boundaries;
  }

  const yesterdayHours = getHourBoundaries(yesterdayStart);
  const todayHours = getHourBoundaries(todayStart);

  function interpolateValue(time: number, beforeDoc: any, afterDoc: any, key: string) {
    if (!beforeDoc) return afterDoc?.[key];
    if (!afterDoc) return beforeDoc?.[key];

    const t0 = beforeDoc._moment.valueOf();
    const t1 = afterDoc._moment.valueOf();
    const v0 = beforeDoc[key];
    const v1 = afterDoc[key];

    if (t1 === t0) return v0;
    return v0 + ((v1 - v0) * (time - t0)) / (t1 - t0);
  }

  function filterDataByDay(day: moment.Moment) {
    const dayStr = day.format("YYYY-MM-DD");
    return data.filter((doc) => doc._moment.format("YYYY-MM-DD") === dayStr);
  }

  const dataByDay = {
    Today: filterDataByDay(todayStart),
    Yesterday: filterDataByDay(yesterdayStart),
  };

  function findBoundingDocs(docs: any[], targetTime: number) {
    if (docs.length === 0) return { before: null, after: null };

    let before = null;
    let after = null;

    let low = 0, high = docs.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = docs[mid]._moment.valueOf();

      if (midTime === targetTime) {
        before = docs[mid];
        after = docs[mid];
        break;
      } else if (midTime < targetTime) {
        before = docs[mid];
        low = mid + 1;
      } else {
        after = docs[mid];
        high = mid - 1;
      }
    }
    return { before, after };
  }

  const hourly: any[] = [];

  for (let h = 0; h < 24; h++) {
    const hourStr = todayHours[h].format("HH:00");

    let todayTotal = 0;
    let yesterdayTotal = 0;

    for (const key of this.Compressor2Keys) {
      const yStart = yesterdayHours[h].valueOf();
      const yEnd = yesterdayHours[h + 1].valueOf();
      const tStart = todayHours[h].valueOf();
      const tEnd = todayHours[h + 1].valueOf();

      const { before: yBeforeStart, after: yAfterStart } = findBoundingDocs(dataByDay.Yesterday, yStart);
      const { before: yBeforeEnd, after: yAfterEnd } = findBoundingDocs(dataByDay.Yesterday, yEnd);

      const valStartYesterday = interpolateValue(yStart, yBeforeStart, yAfterStart, key);
      const valEndYesterday = interpolateValue(yEnd, yBeforeEnd, yAfterEnd, key);
      if (valStartYesterday != null && valEndYesterday != null) {
        yesterdayTotal += valEndYesterday - valStartYesterday;
      }

      const { before: tBeforeStart, after: tAfterStart } = findBoundingDocs(dataByDay.Today, tStart);
      const { before: tBeforeEnd, after: tAfterEnd } = findBoundingDocs(dataByDay.Today, tEnd);

      const valStartToday = interpolateValue(tStart, tBeforeStart, tAfterStart, key);
      const valEndToday = interpolateValue(tEnd, tBeforeEnd, tAfterEnd, key);
      if (valStartToday != null && valEndToday != null) {
        todayTotal += valEndToday - valStartToday;
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
