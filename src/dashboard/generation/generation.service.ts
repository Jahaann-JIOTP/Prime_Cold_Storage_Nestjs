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
  // Meter aur unke corresponding suffix ko alag-alag define karen
  const meterSuffixMap: Record<string, string> = {
    U1: "Active_Energy_Total_Consumed",
    U2: "Active_Energy_Total",
  };

  // Solar and transformer groups (agar alag karna ho to)
  const solarKeys = ["U2"];
  const transformerKeys = ["U1"];

  // Projection tayar karen sirf required meter_suffix ke liye
  const projection: Record<string, number> = { timestamp: 1 };
  Object.entries(meterSuffixMap).forEach(([meterId, suffix]) => {
    projection[`${meterId}_${suffix}`] = 1;
  });

  // Data fetch karen sorted by timestamp
  const data = await this.generationModel.aggregate([
    {
      $match: {
        timestamp: {
          $gte: range.start,
          $lte: range.end,
        },
      },
    },
    { $project: projection },
    { $sort: { timestamp: 1 } },
  ]);

  // Initialize first and last values for each meter_suffix key
  const firstValues: Record<string, number | null> = {};
  const lastValues: Record<string, number | null> = {};
  Object.entries(meterSuffixMap).forEach(([meterId, suffix]) => {
    const key = `${meterId}_${suffix}`;
    firstValues[key] = null;
    lastValues[key] = null;
  });

  // Populate first and last values for each key from data
  for (const doc of data) {
    Object.entries(meterSuffixMap).forEach(([meterId, suffix]) => {
      const key = `${meterId}_${suffix}`;
      const val = doc[key];
      if (typeof val === "number") {
        if (firstValues[key] === null) firstValues[key] = val;
        lastValues[key] = val;
      }
    });
  }

  // Calculate consumption (last - first) for each meter_suffix key
  const consumption: Record<string, number> = {};
  Object.keys(firstValues).forEach(key => {
    if (firstValues[key] !== null && lastValues[key] !== null) {
      const diff = lastValues[key]! - firstValues[key]!;
      consumption[key] = diff >= 0 ? diff : 0;  // Negative diff ko zero karen (meter reset handling)
    } else {
      consumption[key] = 0;
    }
  });

  // Sum consumption per meter group
  const sumByMeterGroup = (meterIds: string[]) =>
    meterIds.reduce((sum, meterId) => {
      const key = `${meterId}_${meterSuffixMap[meterId]}`;
      return sum + (consumption[key] || 0);
    }, 0);

  const solarTotal = sumByMeterGroup(solarKeys);
  const transformerTotal = sumByMeterGroup(transformerKeys);

  const totalConsumption = solarTotal + transformerTotal;

  // Optional debug logs
  console.log("Solar Consumption:", solarTotal);
  console.log("Transformer Consumption:", transformerTotal);
  console.log("Total Consumption:", totalConsumption);

  return +totalConsumption.toFixed(2);
}



  
  



// async getWeeklyGeneration() {
//   const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
//   const result: { Day: string; [key: string]: number | string }[] = [];

//   const now = moment().tz('Asia/Karachi');

//   // Get Monday of this week in Asia/Karachi
//   const mondayThisWeek = now.clone().startOf('week').add(1, 'day'); // Monday
//   if (mondayThisWeek.day() === 1) {
//     // Confirmed Monday
//     for (let i = 0; i < 7; i++) {
//       const thisDayStart = mondayThisWeek.clone().add(i, 'days').startOf('day');
//       const thisDayEnd = thisDayStart.clone().endOf('day');

//       const lastWeekStart = thisDayStart.clone().subtract(7, 'days');
//       const lastWeekEnd = thisDayEnd.clone().subtract(7, 'days');

//       const thisWeekConsumption = await this.calculateConsumption({
//         start: thisDayStart.toISOString(),
//         end: thisDayEnd.toISOString(),
//       });

//       const lastWeekConsumption = await this.calculateConsumption({
//         start: lastWeekStart.toISOString(),
//         end: lastWeekEnd.toISOString(),
//       });

//       result.push({
//         Day: days[i],
//         "This Week": +thisWeekConsumption.toFixed(2),
//         "Last Week": +lastWeekConsumption.toFixed(2),
//       });
//     }
//   }

//   return result;
// }


async calculateConsumption1(range: { start: string; end: string }): Promise<number> {
  // Required keys sirf
  const solarKeys = ["U2_Active_Energy_Total"];
  const wapdaKeys = ["U1_Active_Energy_Total_Consumed"];

  // Projection banayen sirf required keys ke liye
  const projection: Record<string, number> = { timestamp: 1 };
  [...solarKeys, ...wapdaKeys].forEach(key => {
    projection[key] = 1;
  });

  // Timestamp ko UTC me convert karen consistency ke liye
  const startUTC = moment.tz(range.start, 'Asia/Karachi').utc().toISOString();
  const endUTC = moment.tz(range.end, 'Asia/Karachi').utc().toISOString();

  const data = await this.generationModel.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startUTC,
          $lte: endUTC,
        },
      },
    },
    { $project: projection },
    { $sort: { timestamp: 1 } },
  ]);

  // Initialize first and last values for each key
  const firstValues: Record<string, number | null> = {};
  const lastValues: Record<string, number | null> = {};
  [...solarKeys, ...wapdaKeys].forEach(key => {
    firstValues[key] = null;
    lastValues[key] = null;
  });

  // Find first and last non-null values for each key in the data
  for (const doc of data) {
    [...solarKeys, ...wapdaKeys].forEach(key => {
      const val = doc[key];
      if (typeof val === "number") {
        if (firstValues[key] === null) firstValues[key] = val;
        lastValues[key] = val;
      }
    });
  }

  // Calculate consumption for each key and avoid negative values (meter resets)
  const consumption: Record<string, number> = {};
  [...solarKeys, ...wapdaKeys].forEach(key => {
    if (firstValues[key] !== null && lastValues[key] !== null) {
      const diff = lastValues[key]! - firstValues[key]!;
      consumption[key] = diff >= 0 ? diff : 0;
    } else {
      consumption[key] = 0;
    }
  });

  // Sum per group
  const sumGroup = (keys: string[]) =>
    keys.reduce((sum, key) => sum + (consumption[key] || 0), 0);

  const solar = sumGroup(solarKeys);
  const wapdaImport = sumGroup(wapdaKeys);
  const totalConsumption = solar + wapdaImport;

  // Debug logs
  console.log(`[DEBUG] Range: ${startUTC} to ${endUTC}`);
  console.log(`[DEBUG] Solar Consumption:`, solar);
  console.log(`[DEBUG] WAPDA Import Consumption:`, wapdaImport);
  console.log(`[DEBUG] Total Consumption:`, totalConsumption);

  return +totalConsumption.toFixed(2);
}






async getWeeklyGeneration() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result: { Day: string; [key: string]: number | string }[] = [];

  const now = moment().tz('Asia/Karachi');
  const mondayThisWeek = now.clone().startOf('week').add(1, 'day'); // Monday

  if (mondayThisWeek.day() === 1) {
    for (let i = 0; i < 7; i++) {
      const thisDayStart = mondayThisWeek.clone().add(i, 'days').startOf('day');
      const thisDayEnd = thisDayStart.clone().endOf('day');

      const lastWeekStart = thisDayStart.clone().subtract(7, 'days');
      const lastWeekEnd = thisDayEnd.clone().subtract(7, 'days');

      // Call updated calculateConsumption to get total consumption for that day
      const thisWeekConsumption = await this.calculateConsumption1({
        start: thisDayStart.toISOString(),
        end: thisDayEnd.toISOString(),
      });

      const lastWeekConsumption = await this.calculateConsumption1({
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











  
 





async getTodayGeneration(): Promise<HourlyData[]> {
  // Get start and end times for today and yesterday (assumed to return Date objects)
  const todayRange = this.getDayRange(0);    // { start: Date, end: Date }
  const yesterdayRange = this.getDayRange(-1);

  // Define meters and their respective energy tags
  const meterTags: Record<string, string> = {
    U1: "Active_Energy_Total_Consumed",  // e.g. solar
    U2: "Active_Energy_Total",           // e.g. wapda/grid
  };

  // Prepare projection for mongoose aggregate query
  const projection: Record<string, number> = { timestamp: 1 };
  Object.entries(meterTags).forEach(([id, tag]) => {
    projection[`${id}_${tag}`] = 1;
  });

  // Fetch data for today and yesterday from MongoDB using aggregation
  const todayData = await this.generationModel.aggregate([
    { $match: { timestamp: { $gte: todayRange.start, $lte: todayRange.end } } },
    { $project: projection },
    { $sort: { timestamp: 1 } }
  ]);

  const yesterdayData = await this.generationModel.aggregate([
    { $match: { timestamp: { $gte: yesterdayRange.start, $lte: yesterdayRange.end } } },
    { $project: projection },
    { $sort: { timestamp: 1 } }
  ]);

  // Array to hold hourly results
  const hourlyData: HourlyData[] = [];

  // Function to calculate consumption for a single hour
  const calculateHourConsumption = (data: any[], hour: number): number => {
    const firstValues: Record<string, number> = {};
    const lastValues: Record<string, number> = {};

    data.forEach(doc => {
      const karachiTime = moment(doc.timestamp).tz("Asia/Karachi");
      if (karachiTime.hour() === hour) {
        // For each meter tag, record first and last values in this hour
        Object.entries(meterTags).forEach(([id, tag]) => {
          const key = `${id}_${tag}`;
          if (doc[key] !== undefined) {
            if (firstValues[key] === undefined) firstValues[key] = doc[key];
            lastValues[key] = doc[key];
          }
        });
      }
    });

    // If no data for this hour, consumption = 0
    if (Object.keys(firstValues).length === 0 || Object.keys(lastValues).length === 0) {
      return 0;
    }

    // Sum differences (last - first) for all meters in this hour
    let consumption = 0;
    Object.keys(firstValues).forEach(key => {
      let diff = lastValues[key] - firstValues[key];
      if (diff < 0) diff = 0; // prevent negative values if meter resets
      consumption += diff;
    });

    return +consumption.toFixed(2);
  };

  // Calculate hourly consumption for today and yesterday
  for (let hour = 0; hour < 24; hour++) {
    const todayConsumption = calculateHourConsumption(todayData, hour);
    const yesterdayConsumption = calculateHourConsumption(yesterdayData, hour);

    hourlyData.push({
      Time: `${hour.toString().padStart(2, "0")}:00`,
      Today: todayConsumption,
      Yesterday: yesterdayConsumption,
    });
  }

  // Optional: log output for debug
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
  
  
  
  
  
  
  
  


