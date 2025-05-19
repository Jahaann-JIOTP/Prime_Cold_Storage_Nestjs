
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { LogsQueryDto } from './dto/logs-query.dto';

@Injectable()
export class LogsDataService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private readonly tagGroups = {
    voltage: [
      'Voltage_L1N', 'Voltage_L2N', 'Voltage_L3N',
      'Voltage_L1L2', 'Voltage_L2L3', 'Voltage_L3L1',
    ],
    current: ['Current_L1', 'Current_L2', 'Current_L3', 'Total_Current'],
    active_power: ['Active_Power_L1', 'Active_Power_L2', 'Active_Power_L3', 'Total_Active_Power'],
  };

  async fetchLogs(query: LogsQueryDto) {
    const { type, meters, start_date, end_date } = query;

    const tagsToFetch = this.tagGroups[type];
    if (!tagsToFetch) {
      return { success: false, message: 'Invalid type specified.' };
    }

    const meterIds = meters.split(',');
    const db = this.connection.useDb('iotdb');

    const collectionName = 'prime_historical_data';
    const collection = db.collection(collectionName);

    // ✅ Properly create date strings with UTC timezone
const { start_date: startDate, end_date: endDate } = query;

const startISO = new Date(startDate + 'T00:00:00.000Z');
const endISO = new Date(endDate + 'T23:59:59.999Z');
 
const dbQuery = {
  timestamp: {
    $gte: startISO.toISOString(),
    $lte: endISO.toISOString(),
  },
};


    const data = await collection.find(dbQuery).toArray();
    console.log(`Fetched ${data.length} records`);

    const results: any[] = [];

    for (const item of data) {
      for (const meterId of meterIds) {
        const entry: any = {
          time: item.timestamp ? new Date(item.timestamp).toISOString() : null,
          meterId,
        };

        for (const tag of tagsToFetch) {
          const field = `${meterId}_${tag}`;
          if (item[field] !== undefined) {
            if (type === 'active_power' && ['U_24', 'U_25'].includes(meterId)) {
              entry[tag] = item[field] / 1000;
            } else if (
              meterId === 'G2_U20' &&
              ['APPARENT_POWER_S1_KVA', 'APPARENT_POWER_S2_KVA', 'APPARENT_POWER_S3_KVA', 'APPARENT_POWER_TOTAL_KVA'].includes(tag)
            ) {
              entry[tag] = item[field] / 1000;
            } else {
              entry[tag] = item[field];
            }
          }
        }

        // Only include entry if it has tags
        if (Object.keys(entry).length > 2) {
          results.push(entry);
        }
      }
    }

    return { success: true, data: results };
  }
}
