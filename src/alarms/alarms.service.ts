import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as moment from 'moment-timezone';

import { Alarm, AlarmDocument } from './schemas/alarm.schema';
import { Meter, MeterDocument } from './schemas/meter.schema';
import { RecentAlarm, RecentAlarmDocument } from './schemas/recent-alarm.schema';
import { Bell, BellDocument } from './schemas/bell.schema'; // ✅ NEW

@Injectable()
export class AlarmsService {
  constructor(
    @InjectModel(Alarm.name, 'prime_cold')
    private readonly alarmModel: Model<AlarmDocument>,

    @InjectModel(Meter.name, 'prime_cold')
    private readonly meterModel: Model<MeterDocument>,

    @InjectModel(RecentAlarm.name, 'prime_cold')
    private readonly recentAlarmModel: Model<RecentAlarmDocument>,

    @InjectModel(Bell.name, 'prime_cold') // ✅ NEW
    private readonly bellModel: Model<BellDocument>
  ) {}

  async checkAlarms() {
    const url = 'http://13.234.241.103:1880/prime_cold';
    let url_data: Record<string, number>;

    try {
      const response = await axios.get(url);
      url_data = response.data;

      const units = ['U1', 'U2', 'U3', 'U4', 'U5'];
      for (const unit of units) {
        const v1 = Number(url_data[`${unit}_Voltage_L1L2`] || 0);
        const v2 = Number(url_data[`${unit}_Voltage_L2L3`] || 0);
        const v3 = Number(url_data[`${unit}_Voltage_L3L1`] || 0);

        url_data[`${unit}_Voltage_AVG`] = (v1 > 0 && v2 > 0 && v3 > 0)
          ? Number(((v1 + v2 + v3) / 3).toFixed(2))
          : 0;
      }

      console.log('✅ URL Data with Voltage_AVG:', url_data);
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
      'Solar1 Low Voltage': 'U2_Voltage_AVG',
      'Solar1 High Voltage': 'U2_Voltage_AVG',
      'Solar1 High Current': 'U2_Current_AVG',
      'Wapda Low Voltage': 'U1_Voltage_AVG',
      'Wapda High Voltage': 'U1_Voltage_AVG',
      'Wapda High Current': 'U1_Current_AVG',
      'Compressor1 Low Voltage': 'U3_Voltage_AVG',
      'Compressor1 High Voltage': 'U3_Voltage_AVG',
      'Compressor1 High Current': 'U3_Current_AVG',
      'Compressor2 Low Voltage': 'U4_Voltage_AVG',
      'Compressor2 High Voltage': 'U4_Voltage_AVG',
      'Compressor2 High Current': 'U4_Current_AVG',
      'Compressor3 Low Voltage': 'U5_Voltage_AVG',
      'Compressor3 High Voltage': 'U5_Voltage_AVG',
      'Compressor3 High Current': 'U5_Current_AVG',
    };

    const now = moment().tz('Asia/Karachi');
    const todayStart = now.clone().startOf('day').toDate();
    const todayEnd = now.clone().endOf('day').toDate();

    for (const meter of meters) {
      const key = `${meter.Source} ${meter.Status}`;
      const urlKey = mapping[key];

      if (!urlKey || !(urlKey in url_data)) {
        console.warn(`⚠️ No data for key: ${key} -> ${urlKey}`);
        continue;
      }

      const urlValue = Number(url_data[urlKey]);
      const dbValue = Number(meter.Value);

      if (isNaN(urlValue) || isNaN(dbValue)) {
        console.warn(`⚠️ Invalid numbers - url: ${urlValue}, db: ${dbValue}`);
        continue;
      }

      if (urlValue <= 10) {
        console.log(`🚫 Skipping alarm for ${key} because urlValue (${urlValue}) ≤ 10`);
        continue;
      }

      const isMet = alarmConditions[meter.Status]?.(dbValue, urlValue);

      const todayAlarm = await this.alarmModel.findOne({
        Source: meter.Source,
        Status: meter.Status,
        Time: { $gte: todayStart, $lte: todayEnd },
      });

      if (isMet) {
        if (!todayAlarm) {
          const newAlarmData = {
            Source: meter.Source,
            Status: meter.Status,
            Time: now.toDate(),
            db_value: dbValue,
            url_value: urlValue,
            status1: meter.Status,
            alarm_count: 1,
            current_time: now.toDate(),
            end_time: null,
          };

          const newAlarm = new this.alarmModel(newAlarmData);
          await newAlarm.save();

          const newBell = new this.bellModel(newAlarmData);
          await newBell.save();

          console.log('✅ New alarm inserted (and saved to bells)');
        } else if (todayAlarm.end_time !== null) {
          const updateData = {
            $set: {
              db_value: dbValue,
              url_value: urlValue,
              current_time: now.toDate(),
              end_time: null,
            },
            $inc: { alarm_count: 1 },
          };

          await this.alarmModel.updateOne({ _id: todayAlarm._id }, updateData);
          await this.bellModel.updateOne(
            { Source: meter.Source, Status: meter.Status, Time: todayAlarm.Time },
            updateData,
            { upsert: true }
          );

          console.log('🔁 Reactivated existing alarm (and updated bells)');
        } else {
          console.log('⏸️ Alarm already active');
        }
      } else {
        if (todayAlarm && todayAlarm.end_time === null) {
          const resolveData = {
            $set: {
              end_time: now.toDate(),
              db_value: dbValue,
              url_value: urlValue,
            },
          };

          await this.alarmModel.updateOne({ _id: todayAlarm._id }, resolveData);
          await this.bellModel.updateOne(
            { Source: meter.Source, Status: meter.Status, Time: todayAlarm.Time },
            resolveData
          );

          console.log('🔕 Alarm resolved (and bells updated)');
        } else {
          console.log('✅ No alarm to end');
        }
      }
    }

    const alarms = await this.alarmModel.find().sort({ Time: -1 });

    return alarms.map(alarm => ({
      _id: alarm._id,
      Source: alarm.Source,
      status1: alarm.status1,
      current_time: alarm.current_time
        ? moment(alarm.current_time).tz('Asia/Karachi').format('YYYY-MM-DD hh:mm:ss A')
        : null,
      db_value: alarm.db_value,
      url_value: alarm.url_value,
      alarm_count: alarm.alarm_count,
      end_time: alarm.end_time
        ? moment(alarm.end_time).tz('Asia/Karachi').format('YYYY-MM-DD hh:mm:ss A')
        : null,
    }));
  }





  
  
  

  // async fetchAndSaveAlarmsFromLocalhost() {
  //   const url = 'http://localhost:5000/alarms';
  //        console.log("£££££££££££££££££££££   i am auto calling this fun£££££££££££££££££££££££££££££££££££££££");
  //   try {
  //     const response = await axios.get(url);
  //     const alarms = response.data;
  
  //     if (!Array.isArray(alarms)) {
  //       console.error('❌ Expected an array from API:', typeof alarms);
  //       return { success: false, message: 'Invalid data from /alarms' };
  //     }
  
  //     const savedAlarms: AlarmDocument[] = [];
  
  //     for (const alarmData of alarms) {
  //       const filter = {
  //         Source: alarmData.Source,
  //         Status: alarmData.Status,
  //         end_time: null
  //       };
  
  //       const existingAlarm = await this.alarmModel.findOne(filter);
  
  //       if (existingAlarm) {
  //         if (!existingAlarm.end_time) {
  //           existingAlarm.db_value = alarmData.db_value || 0;
  //           existingAlarm.url_value = alarmData.url_value || 0;
  //           existingAlarm.alarm_count = alarmData.alarm_count || 1;
  
  //           // Save end_time in Karachi timezone
  //           existingAlarm.end_time = alarmData.end_time
  //             ? moment.tz(alarmData.end_time, "Asia/Karachi").toDate()
  //             : null;
  
  //           const updated = await existingAlarm.save();
  //           savedAlarms.push(updated);
  //           console.log('🔄 Updated existing active alarm:', updated);
  //         }
  //       } else {
  //         const newAlarm = new this.alarmModel({
  //           Source: alarmData.Source || 'Unknown Source',
  //           Status: alarmData.Status || 'Unknown Status',
  //           status1: alarmData.Status || 'Unknown Status',
  //           db_value: alarmData.db_value || 0,
  //           url_value: alarmData.url_value || 0,
  //           alarm_count: alarmData.alarm_count || 1,
  
  //           // current_time can remain in UTC if you prefer
  //           current_time: moment.tz("Asia/Karachi").utc().toDate(),
  
  //           // Save end_time in Karachi timezone
  //           end_time: alarmData.end_time
  //             ? moment.tz(alarmData.end_time, "Asia/Karachi").toDate()
  //             : null,
  //         });
  
  //         const saved = await newAlarm.save();
  //         savedAlarms.push(saved);
  //         console.log('✅ Saved new alarm:', saved);
  //       }
  //     }
  
  //     console.log(`✅ Done: ${savedAlarms.length} alarms saved/updated`);
  
  //     return {
  //       success: true,
  //       message: `${savedAlarms.length} alarms saved/updated from localhost`,
  //       data: savedAlarms,
  //     };
  //   } catch (error) {
  //     console.error('❌ Error fetching/saving alarms:', error.message);
  //     return {
  //       success: false,
  //       message: 'Error fetching/saving alarms from localhost',
  //       error: error.message,
  //     };
  //   }
  // }
  

 


  
  
  
  
  
  


  
  

 
  
  
  
  
  
  
  
 async checkRecentAlarms(filter: string) {
  let startDate: Date;
  let endDate: Date;

  // ✅ Set start and end dates based on filter
  switch (filter.toLowerCase()) {
    case 'today':
      startDate = moment().tz('Asia/Karachi').startOf('day').toDate();
      endDate = moment().tz('Asia/Karachi').endOf('day').toDate();
      break;
    case 'last7days':
      startDate = moment().tz('Asia/Karachi').subtract(7, 'days').startOf('day').toDate();
      endDate = moment().tz('Asia/Karachi').subtract(1, 'days').endOf('day').toDate();
      break;
    case 'last15days':
      startDate = moment().tz('Asia/Karachi').subtract(15, 'days').startOf('day').toDate();
      endDate = moment().tz('Asia/Karachi').subtract(1, 'days').endOf('day').toDate();
      break;
    case 'last30days':
      startDate = moment().tz('Asia/Karachi').subtract(30, 'days').startOf('day').toDate();
      endDate = moment().tz('Asia/Karachi').subtract(1, 'days').endOf('day').toDate();
      break;
    default:
      throw new Error("Invalid filter provided.");
  }

  // ✅ Query alarms using Date type comparison
  const alarms = await this.alarmModel.find({
    current_time: { $gte: startDate, $lte: endDate }
  }).sort({ current_time: -1 });

  const uniqueAlarms = alarms.filter((value, index, self) =>
    index === self.findIndex((t) =>
      t.Source === value.Source && t.Status === value.Status
    )
  );

  const formattedAlarms = uniqueAlarms.map(alarm => {
    let durationFormatted: string | null = null;

    if (alarm.end_time) {
      const endTime = moment(alarm.end_time).tz('Asia/Karachi');
      const startTime = moment(alarm.current_time).tz('Asia/Karachi');
      const duration = moment.duration(endTime.diff(startTime));

      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
      if (seconds > 0) parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);

      durationFormatted = parts.join(' ');
    }

    return {
      Source: alarm.Source || 'Unknown',
      Status: alarm.Status || 'Unknown',
      start_time: moment(alarm.current_time).tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss'),
      end_time: alarm.end_time ? moment(alarm.end_time).tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss') : null,
      duration: durationFormatted || 'Ongoing',
    };
  });

  if (formattedAlarms.length > 0) {
    try {
      const existingAlarms = await this.recentAlarmModel.find({
        Source: { $in: formattedAlarms.map(alarm => alarm.Source) },
        Status: { $in: formattedAlarms.map(alarm => alarm.Status) },
        start_time: { $in: formattedAlarms.map(alarm => alarm.start_time) },
      });

      const newAlarms = formattedAlarms.filter(alarm =>
        !existingAlarms.some(existingAlarm =>
          existingAlarm.Source === alarm.Source &&
          existingAlarm.Status === alarm.Status &&
          existingAlarm.start_time === alarm.start_time
        )
      );

      if (newAlarms.length > 0) {
        await this.recentAlarmModel.insertMany(newAlarms, { ordered: false });
        console.log('✅ New alarms inserted successfully!');
      } else {
        console.log('No new alarms to insert.');
      }
    } catch (err) {
      console.error('❌ Error while inserting new alarms:', err.message);
    }
  }

  return formattedAlarms;
}

  
  
  


// async fetchAndSaveRecentAlarms(filter: string) {
//   const validFilters = ['today', 'last7days', 'last15days', 'last30days'];
//     // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@     I AM GOING TO SAVE IN DB @@@@@@@@@@@@@");
//   // Validate filter
//   if (!validFilters.includes(filter.toLowerCase())) {
//     throw new Error("Invalid filter provided.");
//   }

//   const apiUrl = `http://localhost:5000/alarms/recent?filter=${filter}`;

//   try {
//     const response = await axios.get(apiUrl);
//     console.log("📡 API Response:", response.data);

//     const alarms = response.data?.data;

//     if (!Array.isArray(alarms)) {
//       throw new Error(`Expected an array from ${apiUrl} but got ${typeof alarms}`);
//     }

//     // Format and clean alarms data (remove _id)
//     const formattedAlarms = alarms.map(alarm => {
//       const { _id, ...rest } = alarm; // remove _id
//       return {
//         Source: rest.Source || 'Unknown',
//         Status: rest.Status || 'Unknown',
//         start_time: rest.start_time || null,
//         end_time: rest.end_time || null,
//         duration: (rest.duration && rest.duration !== 'Null') ? rest.duration : 'Ongoing',
//       };
//     });

//     console.log("🔄 Formatted Alarms (without _id):", formattedAlarms);

//     if (formattedAlarms.length === 0) {
//       return {
//         success: true,
//         message: "No alarms to save.",
//         data: [],
//       };
//     }

//     // Save to database (upsert to avoid duplicates)
//     const promises = formattedAlarms.map(alarm =>
//       this.recentAlarmModel.updateOne(
//         { Source: alarm.Source, Status: alarm.Status, start_time: alarm.start_time }, // Check for existing data
//         { $set: alarm }, // Update data if it exists
//         { upsert: true } // If the record doesn't exist, insert it
//       )
//     );

//     // Execute all the update queries
//     await Promise.all(promises);

//     console.log(`✅ Alarms upserted successfully.`);

//     return {
//       success: true,
//       message: "Alarms inserted/updated successfully.",
//       data: formattedAlarms,
//     };

//   } catch (error) {
//     console.error('❌ Error during alarm save:', error.message);

//     return {
//       success: false,
//       message: 'Saving failed: ' + error.message,
//     };
//   }
// }










}



// ✅ Fixing date parsing
  // private cleanDate(dateInput: string | Date): Date {
  //   const date = typeof dateInput === 'string'
  //     ? new Date(dateInput.replace(' ', 'T'))  // Fixing the date format issue
  //     : new Date(dateInput);
  //   date.setMilliseconds(0); // Ensures consistent comparison
  //   return date;
  // }



  // private formatDuration(start: Date, end: Date): string {
  //   const duration = end.getTime() - start.getTime();
  //   const hours = Math.floor(duration / 3600000);
  //   const minutes = Math.floor((duration % 3600000) / 60000);
  //   const seconds = Math.floor((duration % 60000) / 1000);
  //   return `${hours} hours ${minutes} minutes ${seconds} seconds`;
  // }











// async testInsertAlarm() {
//   const test = new this.recentAlarmModel({
//     Source: 'Test',
//     Status: 'Active',
//     start_time: new Date(),
//     end_time: null,
//     duration: '5 min',
//   });

//   try {
//     const result = await test.save();
//     console.log('✅ Test data inserted:', result);
//     return result;
//   } catch (error) {
//     console.error('❌ Failed to insert test data:', error.message);
//     throw error;
//   }
// }



  

  
  
  
  // ✅ Fixing date parsing
//   private cleanDate(dateInput: string | Date): Date {
//     const date = typeof dateInput === 'string'
//       ? new Date(dateInput.replace(' ', 'T'))  // Fixing the date format issue
//       : new Date(dateInput);
//     date.setMilliseconds(0); // Ensures consistent comparison
//     return date;
//   }
  
  
  
//   private formatDuration(start: Date, end: Date): string {
//     const duration = end.getTime() - start.getTime();
//     const hours = Math.floor(duration / 3600000);
//     const minutes = Math.floor((duration % 3600000) / 60000);
//     const seconds = Math.floor((duration % 60000) / 1000);
//     return `${hours} hours ${minutes} minutes ${seconds} seconds`;
//   }
  
  
// }



