import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Generation } from './schemas/generation.schema';
import { GenerationDto } from './dto/generation.dto'; 
import * as moment from 'moment-timezone';

export interface HourlyData {
  Time: string;
  Today: number;
  Yesterday: number;
}

@Injectable()
export class GenerationService {
  constructor(
    @InjectModel(Generation.name) private readonly generationModel: Model<Generation>
  ) {}

  async handleQuery(query: GenerationDto) {
    switch (query.value) {
      case 'today':
        return this.getTodayGeneration();
      case 'week':
        return this.getWeeklyGeneration();
      case 'month':
        return this.getMonthlyGeneration();
      case 'year':
        return this.getYearlyGeneration();
      default:
        return { error: 'Invalid value' };
    }
  }

  private async calculateConsumption(range: { start: string; end: string }) {
  const meterIds = ["U1", "U2"];
  const suffix = "Active_Energy_Total_Consumed";

  const solarKeys = ["U2"]; // Make sure these are correct for your case
  const transformerKeys = ["U1"];

  // Project only required fields
  const projection: any = { timestamp: 1 };
  meterIds.forEach(id => {
    projection[`${id}_${suffix}`] = 1;
  });

  // Query data sorted by timestamp ascending
  const data = await this.generationModel.aggregate([
    { $match: { timestamp: { $gte: range.start, $lte: range.end } } },
    { $project: projection },
    { $sort: { timestamp: 1 } },
  ]);

  // Object to hold first and last values per meter key
  const firstValues: Record<string, number | null> = {};
  const lastValues: Record<string, number | null> = {};

  meterIds.forEach(id => {
    const key = `${id}_${suffix}`;
    firstValues[key] = null;
    lastValues[key] = null;
  });

  for (const doc of data) {
    meterIds.forEach(id => {
      const key = `${id}_${suffix}`;
      const val = doc[key];

      if (typeof val === "number") {
        // If first value not set, set it
        if (firstValues[key] === null) {
          firstValues[key] = val;
        }
        // Update last value every time we see a new one (since data is sorted ascending)
        lastValues[key] = val;
      }
    });
  }

  // Calculate delta for each meter and sum separately for solar and transformer
  let solarTotal = 0;
  let transformerTotal = 0;

  meterIds.forEach(id => {
    const key = `${id}_${suffix}`;
    const first = firstValues[key];
    const last = lastValues[key];

    if (first !== null && last !== null) {
      const delta = last - first;
      if (solarKeys.includes(id)) {
        solarTotal += delta;
      } else if (transformerKeys.includes(id)) {
        transformerTotal += delta;
      }
    }
  });

  const total = solarTotal + transformerTotal;
  return +total.toFixed(2);
}

  
  



async getWeeklyGeneration() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result: { Day: string; [key: string]: number | string }[] = [];

  const now = moment().tz('Asia/Karachi');

  // Get Monday of this week in Asia/Karachi
  const mondayThisWeek = now.clone().startOf('week').add(1, 'day'); // Monday
  if (mondayThisWeek.day() === 1) {
    // Confirmed Monday
    for (let i = 0; i < 7; i++) {
      const thisDayStart = mondayThisWeek.clone().add(i, 'days').startOf('day');
      const thisDayEnd = thisDayStart.clone().endOf('day');

      const lastWeekStart = thisDayStart.clone().subtract(7, 'days');
      const lastWeekEnd = thisDayEnd.clone().subtract(7, 'days');

      const thisWeekConsumption = await this.calculateConsumption({
        start: thisDayStart.toISOString(),
        end: thisDayEnd.toISOString(),
      });

      const lastWeekConsumption = await this.calculateConsumption({
        start: lastWeekStart.toISOString(),
        end: lastWeekEnd.toISOString(),
      });

      result.push({
        Day: days[i],
        "This Week": +thisWeekConsumption.toFixed(2),
        "Last Week": +lastWeekConsumption.toFixed(2),
      });
    }
  }

  return result;
}









  
 

async getTodayGeneration() {
  const todayRange = this.getDayRange(0); // today
  const yesterdayRange = this.getDayRange(-1); // yesterday

  const meterIds = ["U1", "U2"];
  const suffix = "Active_Energy_Total_Consumed";
  const projection = { timestamp: 1 };
  meterIds.forEach(id => projection[`${id}_${suffix}`] = 1);

  // Fetch today's data
  const todayData = await this.generationModel.aggregate([
    { $match: { timestamp: { $gte: todayRange.start, $lte: todayRange.end } } },
    { $project: projection },
    { $sort: { timestamp: 1 } }
  ]);

  // Fetch yesterday's data
  const yesterdayData = await this.generationModel.aggregate([
    { $match: { timestamp: { $gte: yesterdayRange.start, $lte: yesterdayRange.end } } },
    { $project: projection },
    { $sort: { timestamp: 1 } }
  ]);

  const hourlyData: HourlyData[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const calculateHourConsumption = (data: any[]) => {
      const firstValues = {};
      const lastValues = {};

      data.forEach(doc => {
        const karachiTime = moment(doc.timestamp).tz('Asia/Karachi');
        const docHour = karachiTime.hour();

        if (docHour === hour) {
          meterIds.forEach(id => {
            const key = `${id}_${suffix}`;
            if (doc[key] !== undefined) {
              if (firstValues[key] === undefined) firstValues[key] = doc[key];
              lastValues[key] = doc[key];
            }
          });
        }
      });

      if (Object.keys(firstValues).length === 0 || Object.keys(lastValues).length === 0) {
        return 0; // No valid data
      }

      let consumption = 0;
      Object.keys(firstValues).forEach(key => {
        if (lastValues[key] !== undefined) {
          consumption += (lastValues[key] - firstValues[key]);
        }
      });

      return isNaN(consumption) ? 0 : +consumption.toFixed(2);
    };

    const todayConsumption = calculateHourConsumption(todayData);
    const yesterdayConsumption = calculateHourConsumption(yesterdayData);

    hourlyData.push({
      Time: `${hour.toString().padStart(2, '0')}:00`,
      Today: todayConsumption,
      Yesterday: yesterdayConsumption,
    });
  }

  console.log("Hourly Data:", hourlyData);
  return hourlyData;
}

  
  
  
  
  
  private getDayRange(offset: number): { start: string; end: string } {
    const date = new Date();
    date.setDate(date.getDate() + offset);
  
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
  
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
  
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }
  
  
  

  async getMonthlyGeneration() {
  const weekLabels = ["Week1", "Week2", "Week3", "Week4"];
  const result: { Weeks: string; [key: string]: number | string }[] = [];

  const getWeekRanges = (month: number, year: number) => {
    const weeks: [string, string][] = [];
    const startDate = new Date(year, month - 1, 1); // first day of month
    const firstMonday = new Date(startDate);
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1);
    }

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      weeks.push([
        new Date(weekStart.setHours(0, 0, 0, 0)).toISOString(),
        new Date(weekEnd.setHours(23, 59, 59, 999)).toISOString(),
      ]);
    }

    return weeks;
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonthDate = new Date(now.setMonth(now.getMonth() - 1));
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastYear = lastMonthDate.getFullYear();

  const weeksThisMonth = getWeekRanges(currentMonth, currentYear);
  const weeksLastMonth = getWeekRanges(lastMonth, lastYear);

  for (let i = 0; i < 4; i++) {
    const thisMonth = await this.calculateConsumption({
      start: weeksThisMonth[i][0],
      end: weeksThisMonth[i][1],
    });

    const lastMonth = await this.calculateConsumption({
      start: weeksLastMonth[i][0],
      end: weeksLastMonth[i][1],
    });

    result.push({
      Weeks: weekLabels[i],
      "This Month": +thisMonth.toFixed(2),
      "Last Month": +lastMonth.toFixed(2),
    });
  }

  return result;
}

  private getMonthDateRange(year: number, month: number): { start: string; end: string } {
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // last day of month
  
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }
  

  async getYearlyGeneration(): Promise<
  { Month: string; [key: string]: number | string }[]
> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const result: { Month: string; [key: string]: number | string }[] = [];

  for (let month = 0; month < 12; month++) {
    const currentYearRange = this.getMonthDateRange(currentYear, month);
    const previousYearRange = this.getMonthDateRange(previousYear, month);

    const currentYearConsumption = Number(await this.calculateConsumption(currentYearRange)) || 0;
    const previousYearConsumption = Number(await this.calculateConsumption(previousYearRange)) || 0;

    result.push({
      Month: months[month],
      "Current Year": +currentYearConsumption.toFixed(2),
      "Previous Year": +previousYearConsumption.toFixed(2),
    });
  }

  return result;
}


}
  
  
  
  
  
  
  
  


