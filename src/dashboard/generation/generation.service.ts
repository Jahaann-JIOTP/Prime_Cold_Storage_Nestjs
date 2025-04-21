import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Generation } from './schemas/generation.schema';
import { GenerationDto } from './dto/generation.dto'; 

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
      case 'weekly':
        return this.getWeeklyGeneration();
      case 'monthly':
        return this.getMonthlyGeneration();
      case 'yearly':
        return this.getYearlyGeneration();
      default:
        return { error: 'Invalid value' };
    }
  }

  private async calculateConsumption(range: { start: string; end: string }) {
    const meterIds = [
      "G2_U20", "U_27", "U_24", "U_25",
      "G1_U16", "G1_U17", "G1_U18", "G1_U19"
    ];
    const suffix = "ACTIVE_ENERGY_IMPORT_KWH";

    const projection: any = { timestamp: 1 };
    meterIds.forEach(id => projection[`${id}_${suffix}`] = 1);

    const data = await this.generationModel.aggregate([
      { $match: { timestamp: { $gte: range.start, $lte: range.end } } },
      { $project: projection },
      { $sort: { timestamp: 1 } }
    ]);

    if (!data || data.length < 2) return 0;

    const first = data[0];
    const last = data[data.length - 1];

    let total = 0;
    meterIds.forEach(id => {
      const key = `${id}_${suffix}`;
      const firstVal = first[key];
      const lastVal = last[key];

      if (typeof firstVal === 'number' && typeof lastVal === 'number') {
        total += lastVal - firstVal;
      }
    });

    return +total.toFixed(2);
  }

  async getWeeklyGeneration() {
    const result: { day: string; thisWeek: number; lastWeek: number }[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // Sunday = 7
    const mondayThisWeek = new Date(now);
    mondayThisWeek.setDate(now.getDate() - (currentDay - 1));
    mondayThisWeek.setHours(0, 0, 0, 0);

    const mondayLastWeek = new Date(mondayThisWeek);
    mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);

    for (let i = 0; i < 7; i++) {
      const thisWeekStart = new Date(mondayThisWeek);
      thisWeekStart.setDate(mondayThisWeek.getDate() + i);
      thisWeekStart.setHours(0, 0, 0, 0);

      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setHours(23, 59, 59, 999);

      const lastWeekStart = new Date(mondayLastWeek);
      lastWeekStart.setDate(mondayLastWeek.getDate() + i);
      lastWeekStart.setHours(0, 0, 0, 0);

      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setHours(23, 59, 59, 999);

      const thisWeek = await this.calculateConsumption({
        start: thisWeekStart.toISOString(),
        end: thisWeekEnd.toISOString(),
      });

      const lastWeek = await this.calculateConsumption({
        start: lastWeekStart.toISOString(),
        end: lastWeekEnd.toISOString(),
      });

      result.push({
        day: days[i],
        thisWeek,
        lastWeek,
      });
    }

    console.log("📊 Weekly Result:", result);
    return result;
  }

  
  
 

  
  async getTodayGeneration() {
    const todayRange = this.getDayRange(0); // today
    const yesterdayRange = this.getDayRange(-1); // yesterday
  
    const meterIds = ["G2_U20", "U_27", "U_24", "U_25", "G1_U16", "G1_U17", "G1_U18", "G1_U19"];
    const suffix = "ACTIVE_ENERGY_IMPORT_KWH";
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
          const timestamp = new Date(doc.timestamp);
          const docHour = timestamp.getHours();
  
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
        Time: `${hour < 10 ? '0' + hour : hour}:00`,
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
    const result: { Weeks: string; thisMonth: number; lastMonth: number }[] = [];
  
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
        thisMonth: +thisMonth.toFixed(2),
        lastMonth: +lastMonth.toFixed(2),
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
  { month: string; currentYear: number; previousYear: number }[]
> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const result: { month: string; currentYear: number; previousYear: number }[] = [];

  for (let month = 0; month < 12; month++) {
    const currentYearRange = this.getMonthDateRange(currentYear, month);
    const previousYearRange = this.getMonthDateRange(previousYear, month);

    const currentYearConsumption = Number(await this.calculateConsumption(currentYearRange)) || 0;
    const previousYearConsumption = Number(await this.calculateConsumption(previousYearRange)) || 0;

    result.push({
      month: months[month],
      currentYear: +currentYearConsumption.toFixed(2),
      previousYear: +previousYearConsumption.toFixed(2),
    });
  }

  return result;
}

}
  
  
  
  
  
  
  
  


