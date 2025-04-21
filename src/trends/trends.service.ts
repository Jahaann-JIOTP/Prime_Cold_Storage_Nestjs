// src/trends/trends.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CSNew } from './schemas/CS-new.schema';
import { CSActiveTags } from './schemas/CS-activetags.schema';

@Injectable()
export class TrendsService {
  constructor(
    @InjectModel(CSNew.name) private readonly csNewModel: Model<CSNew>,
    @InjectModel(CSActiveTags.name) private readonly csActiveTagsModel: Model<CSActiveTags>,
  ) {}

  async getTrendData(startDate: string, endDate: string, meterIds: string[], suffixes: string[]) {
    const start = `${startDate}T00:00:00.000+05:00`;
    const end = `${endDate}T23:59:59.999+05:00`;

    const projection: any = { timestamp: 1 };
    meterIds.forEach(meterId => {
      suffixes.forEach(suffix => {
        projection[`${meterId}_${suffix}`] = 1;
      });
    });

    const [newData, activeTagData] = await Promise.all([
      this.csNewModel.find({ timestamp: { $gte: start, $lte: end } }, projection).lean(),
      this.csActiveTagsModel.find({ timestamp: { $gte: start, $lte: end } }, projection).lean(),
    ]);

    const combined = [...newData, ...activeTagData]
      .map(doc => {
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
      })
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return combined;
  }
}
