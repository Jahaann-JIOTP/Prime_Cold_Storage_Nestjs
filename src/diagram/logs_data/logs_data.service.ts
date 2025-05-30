import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { LogsQueryDto } from "./dto/logs-query.dto";
import * as moment from 'moment-timezone';

@Injectable()
export class LogsDataService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private readonly tagGroups = {
    voltage: [
      "Voltage_L1N",
      "Voltage_L2N",
      "Voltage_L3N",
      "Voltage_L1L2",
      "Voltage_L2L3",
      "Voltage_L3L1",
    ],
    current: ["Current_L1", "Current_L2", "Current_L3", "Total_Current"],
    active_power: [
      "Active_Power_L1",
      "Active_Power_L2",
      "Active_Power_L3",
      "Total_Active_Power",
    ],
    power_factor: [
      "Power_Factor_L1",
      "Power_Factor_L2",
      "Power_Factor_L3",
    ],
    reactive_energy: [
      "Reactive_Energy_Total",
    ],
    apparent_energy: [
      "Apparent_Energy_Total",
    ],
    active_energy: [
      "Active_Energy_Total",
      "Active_Energy_Total_Consumed",
      "Active_Energy_Total_Supplied"
    ],
  };

  async fetchLogs(query: LogsQueryDto) {
    const { type, meters, start_date, end_date } = query;

    const baseTags = this.tagGroups[type];
    if (!baseTags) {
      return { success: false, message: "Invalid type specified." };
    }

    const meterIds = meters.split(",");
    const db = this.connection.useDb("iotdb");
    const collectionName = "prime_historical_data";
    const collection = db.collection(collectionName);

    const startISO = `${start_date}T00:00:00.000+05:00`;
    const endISO = `${end_date}T23:59:59.999+05:00`;

    const dbQuery = {
      timestamp: {
        $gte: startISO,
        $lte: endISO,
      },
    };

    const data = await collection.find(dbQuery).toArray();
    console.log(`Fetched ${data.length} records`);

    const results: any[] = [];

    for (const item of data) {
      for (const meterId of meterIds) {
        const entry: any = {
          time: item.timestamp
            ? moment(item.timestamp)
                .tz("Asia/Karachi")
                .format("YYYY-MM-DDTHH:mm:ss.SSSZ")
            : null,
          meterId,
        };

        let tagsToFetch = baseTags;

        if (type === "reactive_energy") {
          if (meterId === "U4") {
            tagsToFetch = ["Reactive_Energy_M4_Total"];
          } else if (["U1", "U2", "U3", "U5"].includes(meterId)) {
            tagsToFetch = ["Reactive_Energy_Total"];
          } else {
            tagsToFetch = [];
          }
        }

        for (const tag of tagsToFetch) {
          const field = `${meterId}_${tag}`;
          if (item[field] !== undefined) {
            entry[tag] = item[field]; // ✅ No division or condition, directly assign
          }
        }

        if (Object.keys(entry).length > 2) {
          results.push(entry);
        }
      }
    }

    return { success: true, data: results };
  }
}
