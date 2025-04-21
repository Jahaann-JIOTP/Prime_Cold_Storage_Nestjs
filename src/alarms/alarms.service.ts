import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Alarm, AlarmDocument } from './schemas/alarm.schema';
import { Meter, MeterDocument } from './schemas/meter.schema';
import * as moment from 'moment-timezone';
import { RecentAlarm, RecentAlarmDocument } from './schemas/recent-alarm.schema';

@Injectable()
export class AlarmsService {
  constructor(
    @InjectModel(Alarm.name, 'Prime_Cold_Alarms')
    private readonly alarmModel: Model<AlarmDocument>,

    @InjectModel(Meter.name, 'Prime_Cold_Alarms')
    private readonly meterModel: Model<MeterDocument>,

    @InjectModel(RecentAlarm.name, 'Prime_Cold_Alarms')
    private readonly recentAlarmModel: Model<RecentAlarmDocument>
  ) {}

 

   async getRecentAlarms(filter: string) {
    // Get current date in Karachi timezone
    const today = moment().tz('Asia/Karachi').format('YYYY-MM-DD');
  
    let startDate: string;
    let endDate: string;
  
    // Calculate start and end dates based on the filter
    switch (filter.toLowerCase()) {
      case 'today':
        startDate = `${today} 00:00:00`;
        endDate = `${today} 23:59:59`;
        break;
      case 'last7days':
        startDate = moment().tz('Asia/Karachi').subtract(7, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment().tz('Asia/Karachi').subtract(1, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        break;
      case 'last15days':
        startDate = moment().tz('Asia/Karachi').subtract(15, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment().tz('Asia/Karachi').subtract(1, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        break;
      case 'last30days':
        startDate = moment().tz('Asia/Karachi').subtract(30, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment().tz('Asia/Karachi').subtract(1, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        break;
      default:
        throw new Error("Invalid filter provided.");
    }
  
    // Query the alarms within the time range
    const alarms = await this.alarmModel.find({
      current_time: { $gte: startDate, $lte: endDate }
    }).sort({ current_time: -1 });
  
    // Format the alarm data with duration
    const formattedAlarms = alarms.map(alarm => {
      let durationFormatted: string | null = null;

      if (alarm.end_time) {
        const duration = moment.duration(moment(alarm.end_time).diff(moment(alarm.current_time)));
      
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();
      
        const parts: string[] = [];  // <-- Fix here
      
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
        if (seconds > 0) parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);
      
        durationFormatted = parts.join(' ');
      }
      
  
      return {
        _id: alarm._id,
        Source: alarm.Source,
        Status: alarm.Status,
        start_time: alarm.current_time,
        end_time: alarm.end_time,
        duration: durationFormatted || 'Ongoing',
      };
    });
  
    // Return structured result
    return {
      success: true,
      data: formattedAlarms
    };
  }

  
  async checkAlarms() {
    const url = 'http://13.234.241.103:1880/latestgcl1';
    let url_data: any;
  
    try {
      const response = await axios.get(url);
      url_data = response.data;
      console.log('✅ URL Data:', url_data);
    } catch (error) {
      console.error('❌ Failed to fetch data from URL:', error.message);
      return [];
    }
  
    const meters = await this.meterModel.find();
    const alarmConditions = {
      'Low Voltage': (db: number, urlValue: number) => urlValue <= db,
      'High Voltage': (db: number, urlValue: number) => urlValue >= db,
      'High Current': (db: number, urlValue: number) => urlValue >= db,
    };
  
    const mapping = {
      'Solar1 Low Voltage': 'G2_U20_VOLTAGE_L_L_AVG_V',
      'Solar1 High Voltage': 'G2_U20_VOLTAGE_L_L_AVG_V',
      'Solar1 High Current': 'G2_U20_CURRENT_TOTAL_A',
      'Solar2 Low Voltage': 'U_27_VOLTAGE_L_L_AVG_V',
      'Solar2 High Voltage': 'U_27_VOLTAGE_L_L_AVG_V',
      'Solar2 High Current': 'U_27_CURRENT_AVG_A',
      'Transformer1 Low Voltage': 'U_24_VOLTAGE_L_L_AVG_V',
      'Transformer1 High Voltage': 'U_24_VOLTAGE_L_L_AVG_V',
      'Transformer1 High Current': 'U_24_CURRENT_TOTAL_A',
      'AirCompressors1 Low Voltage': 'U_5_VOLTAGE_L_L_AVG_V',
      'AirCompressors1 High Voltage': 'U_5_VOLTAGE_L_L_AVG_V',
      'AirCompressors1 High Current': 'U_5_CURRENT_TOTAL_A',
      'BallMills1 Low Voltage': 'U_23_VOLTAGE_L_L_AVG_V',
    };
  
    const now = moment().tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss');
  
    for (const meter of meters) {
      const key = `${meter.Source} ${meter.Status}`;
      const urlKey = mapping[key];
  
      if (!urlKey || !(urlKey in url_data)) {
        console.warn(`⚠️ No data for: ${key}`);
        continue;
      }
  
      const urlValue = parseFloat(url_data[urlKey]);
      const dbValue = meter.Value;
  
      if (isNaN(urlValue) || isNaN(dbValue)) {
        console.warn("⚠️ Skipping due to NaN value", urlValue, dbValue);
        continue;
      }
  
      const isMet = alarmConditions[meter.Status]?.(dbValue, urlValue);
  
      console.log("======= CHECKING CONDITION ========");
      console.log("Status:", meter.Status);
      console.log("Source:", meter.Source);
      console.log("urlValue:", urlValue);
      console.log("dbValue:", dbValue);
      console.log("Condition met?:", isMet);
  
      const lastAlarm = await this.alarmModel.findOne({
        Source: meter.Source,
        Status: meter.Status
      }).sort({ Time: -1 });
  
      if (isMet) {
        if (!lastAlarm) {
          // ➕ Create a new alarm
          const newAlarm = new this.alarmModel({
            Source: meter.Source,
            Status: meter.Status,
            Time: now,  // Set time to now when a new alarm is triggered
            db_value: dbValue,
            url_value: urlValue,
            status1: meter.Status,
            alarm_count: 1,
            current_time: now,  // Set current time when new alarm is triggered
            end_time: null
          });
  
          await newAlarm.save();
          console.log('✅ New alarm inserted');
        } else if (lastAlarm.end_time !== null) {
          // 🔁 Reactivate the last alarm
          await this.alarmModel.updateOne(
            { _id: lastAlarm._id },
            {
              $set: {
                end_time: null,
                db_value: dbValue,
                url_value: urlValue,
                current_time: now  // Set current_time only when alarm is re-activated
              },
              $inc: {
                alarm_count: 1
              }
            }
          );
          console.log('🔁 Alarm re-activated (updated)');
        } else {
          console.log('⏸️ Alarm already active, no changes');
        }
      } else {
        if (lastAlarm && lastAlarm.end_time === null) {
          // 🔕 Alarm resolved
          await this.alarmModel.updateOne(
            { _id: lastAlarm._id },
            {
              $set: {
                end_time: now,  // Set end time when the alarm is resolved
                db_value: dbValue,
                url_value: urlValue
              }
            }
          );
          console.log('🔕 Alarm resolved and end_time updated');
        } else {
          console.log('✅ No active alarm to end');
        }
      }
    }
  
    const alarms = await this.alarmModel.find().sort({ Time: -1 });
  
    return alarms.map(alarm => ({
      _id: alarm._id,
      Source: alarm.Source,
      status1: alarm.status1,
      current_time: alarm.current_time,  // Ensure current_time is consistent
      db_value: alarm.db_value,
      url_value: alarm.url_value,
      alarm_count: alarm.alarm_count,
      end_time: alarm.end_time
        ? moment(alarm.end_time).tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss')
        : null
    }));
  }
  
  
  


  
  

async fetchAndSaveAlarmsFromLocalhost() {
  const url = 'http://localhost:5000/alarms';

  try {
    const response = await axios.get(url);
    const alarms = response.data;

    if (!Array.isArray(alarms)) {
      console.error('❌ Expected an array from API:', typeof alarms);
      return { success: false, message: 'Invalid data from /alarms' };
    }

    const savedAlarms: AlarmDocument[] = [];

    for (const alarmData of alarms) {
      const filter = {
        Source: alarmData.Source,
        Status: alarmData.Status,
        end_time: null
      };

      const existingAlarm = await this.alarmModel.findOne(filter);

      if (existingAlarm) {
        if (!existingAlarm.end_time) {
          existingAlarm.db_value = alarmData.db_value || 0;
          existingAlarm.url_value = alarmData.url_value || 0;
          existingAlarm.alarm_count = alarmData.alarm_count || 1;
          existingAlarm.end_time = alarmData.end_time ? new Date(alarmData.end_time) : null;

          const updated = await existingAlarm.save();
          savedAlarms.push(updated);
          console.log('🔄 Updated existing active alarm:', updated);
        }
      } else {
        // 👇 NEW ALARM ENTRY WITH FORMATTED FIELDS
        const newAlarm = new this.alarmModel({
          Source: alarmData.Source || 'Unknown Source',
          Status: alarmData.Status || 'Unknown Status',
          status1: alarmData.Status || 'Unknown Status',
          db_value: alarmData.db_value || 0,
          url_value: alarmData.url_value || 0,
          alarm_count: alarmData.alarm_count || 1,
          
          // ✅ Store formatted Karachi time as string
          current_time: moment.tz("Asia/Karachi").format("YYYY-MM-DD HH:mm:ss"),
        
          // ✅ Store Date object also adjusted to Karachi timezone
          end_time: alarmData.end_time
            ? moment.tz(alarmData.end_time, "Asia/Karachi").toDate()
            : null,
        });
        

        const saved = await newAlarm.save();
        savedAlarms.push(saved);
        console.log('✅ Saved new alarm:', saved);
      }
    }

    console.log(`✅ Done: ${savedAlarms.length} alarms saved/updated`);

    return {
      success: true,
      message: `${savedAlarms.length} alarms saved/updated from localhost`,
      data: savedAlarms,
    };
  } catch (error) {
    console.error('❌ Error fetching/saving alarms:', error.message);
    return {
      success: false,
      message: 'Error fetching/saving alarms from localhost',
      error: error.message,
    };
  }
  
}

  
    async fetchAndSaveRecentAlarms() {
    const filters = ['today', 'last7days', 'last15days', 'last30days'];
    const savedAlarms: RecentAlarm[] = [];

    for (const filter of filters) {
      const url = `http://localhost:5000/alarms/recent?filter=${filter}`;

      try {
        const response = await axios.get(url);
        const alarms = response.data;

        if (!Array.isArray(alarms)) {
          console.warn(`⚠️ Expected array from ${url} but got`, typeof alarms);
          continue;
        }

        for (const alarm of alarms) {
          const durationFormatted = alarm.end_time
            ? this.formatDuration(moment(alarm.start_time), moment(alarm.end_time))
            : null;

          const record = {
            Source: alarm.Source || 'Unknown',
            Status: alarm.Status || 'Unknown',
            start_time: alarm.start_time ? new Date(alarm.start_time) : null,
            end_time: alarm.end_time ? new Date(alarm.end_time) : null,
            duration: durationFormatted,
          };

          // Prevent duplicates
          const existing = await this.recentAlarmModel.findOne({
            Source: record.Source,
            Status: record.Status,
            start_time: record.start_time,
          });

          if (!existing) {
            const newEntry = new this.recentAlarmModel(record);
            const saved = await newEntry.save();
            savedAlarms.push(saved);
            console.log(`✅ Saved recent alarm [${filter}]:`, record.Source);
          } else {
            console.log(`⏭️ Skipped duplicate alarm [${filter}]:`, record.Source);
          }
        }
      } catch (err) {
        console.error(`❌ Error fetching from ${url}:`, err.message);
      }
    }

    console.log(`📦 Done! Total recent alarms saved: ${savedAlarms.length}`);
    return {
      success: true,
      message: `${savedAlarms.length} recent alarms saved`,
      data: savedAlarms,
    };
  }

  // Helper to format duration
  private formatDuration(start: moment.Moment, end: moment.Moment): string {
    const duration = moment.duration(end.diff(start));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);

    return parts.join(' ') || '0 sec';
  }
}
  

  




