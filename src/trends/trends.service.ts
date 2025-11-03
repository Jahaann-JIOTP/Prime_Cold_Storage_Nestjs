// src/trends/trends.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CSNew } from './schemas/CS-new.schema';
import * as moment from 'moment-timezone';
@Injectable()
export class TrendsService {
  constructor(
    @InjectModel(CSNew.name) private readonly csNewModel: Model<CSNew>,
  ) {}

  async getTrendData(startDate: string, endDate: string, meterIds: string[], suffixes: string[]) {
      const startMoment = moment.tz(startDate, 'YYYY-MM-DD', 'Asia/Karachi').startOf('day');
      const endMoment = moment.tz(endDate, 'YYYY-MM-DD', 'Asia/Karachi')
          .add(1, 'day')
          .add(1, 'minute');

    const projection: any = { timestamp: 1 };
    meterIds.forEach(meterId => {
      suffixes.forEach(suffix => {
        projection[`${meterId}_${suffix}`] = 1;
      });
    });

    const newData = await this.csNewModel
        .find({
            timestamp: {
                $gte: startMoment.toISOString(true),
                $lte: endMoment.toISOString(true),
            }
        }, projection)
      .lean();

    const formatted = newData.map(doc => {
      const data: any = {};
      meterIds.forEach(meterId => {
        suffixes.forEach(suffix => {
          const key = `${meterId}_${suffix}`;
          if (doc[key] !== undefined) {
            data[key] = doc[key];
          }
        });
      });

      return {
        timestamp: doc.timestamp,
        data,
      };
    });

    // Sort data by timestamp
    formatted.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return formatted;
  }
}
