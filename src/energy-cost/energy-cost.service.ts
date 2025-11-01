import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetEnergyCostDto } from './dto/get-energy-cost.dto';
import { EnergyCost } from './schemas/energy-cost.schema';
import * as moment from 'moment-timezone';

@Injectable()
export class EnergyCostService {
    constructor(
        @InjectModel(EnergyCost.name) private costModel: Model<EnergyCost>,
    ) { }

    async getConsumptionData(dto: GetEnergyCostDto) {
        const { start_date, start_time, end_date, end_time, meterIds, suffixes } = dto;

        const suffixArray = suffixes || [];

        // Handle time formats - ensure they have proper format
        const formatTime = (time: string | undefined): string => {
            if (!time) return '00:00:00.000';
            if (time.length === 5) return `${time}:00.000`; // HH:mm -> HH:mm:00.000
            if (time.length === 8) return `${time}.000`;    // HH:mm:ss -> HH:mm:ss.000
            return time; // Assume it's already in HH:mm:ss.SSS format
        };

        const startTime = formatTime(start_time);
        const endTime = formatTime(end_time);

        // Create moment objects for the range
        const startMoment = moment.tz(`${start_date} ${startTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');
        let endMoment = moment.tz(`${end_date} ${endTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');

        // Special handling for end_time = "00:00" - include next day's first reading
        if (end_time === '00:00' || end_time === '00:00:00' || end_time === '00:00:00.000' || end_time === '23:55' || end_time === '23:55:59' || end_time === '23:55:59.999') {
            // Add 1 minute to ensure we include the first document of the next day
            endMoment = moment.tz(`${end_date} 00:00:00.000`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi')
                .add(1, 'day')
                .add(1, 'minute'); // Add 1 minute to include documents at 00:00:00 of next day
        }

        const startOfRange = startMoment.toISOString(true);
        const endOfRange = endMoment.toISOString(true);

        console.log('Query Range:', {
            start: startOfRange,
            end: endOfRange,
            meterIds,
            suffixes: suffixArray
        });

        const result: {
            meterId: string;
            startValue: number;
            endValue: number;
            consumption: number;
            startTimestamp: string;
            endTimestamp: string;
        }[] = [];

        for (let i = 0; i < meterIds.length; i++) {
            const meterId = meterIds[i];

            let suffix = '';
            if (meterId === 'U2') {
                suffix = 'Active_Energy_Total';
                if (!suffixArray.includes('Active_Energy_Total')) {
                    continue;
                }
            } else {
                suffix = suffixArray[i] || suffixArray[0];
            }

            if (!suffix) continue;

            const key = `${meterId}_${suffix}`;

            try {
                const firstDoc = await this.costModel
                    .findOne({
                        timestamp: { $gte: startOfRange, $lte: endOfRange },
                        [key]: { $exists: true, $ne: null }
                    })
                    .select({ [key]: 1, timestamp: 1 })
                    .sort({ timestamp: 1 })
                    .lean();

                const lastDoc = await this.costModel
                    .findOne({
                        timestamp: { $gte: startOfRange, $lte: endOfRange },
                        [key]: { $exists: true, $ne: null }
                    })
                    .select({ [key]: 1, timestamp: 1 })
                    .sort({ timestamp: -1 })
                    .lean();

                console.log(`Results for ${key}:`, {
                    firstDoc: firstDoc ? { value: firstDoc[key], timestamp: firstDoc.timestamp } : null,
                    lastDoc: lastDoc ? { value: lastDoc[key], timestamp: lastDoc.timestamp } : null
                });

                if (firstDoc && lastDoc && firstDoc[key] !== undefined && lastDoc[key] !== undefined) {
                    const startValue = firstDoc[key];
                    const endValue = lastDoc[key];
                    const consumption = endValue - startValue;

                    result.push({
                        meterId,
                        startValue,
                        endValue,
                        consumption,
                        startTimestamp: firstDoc.timestamp,
                        endTimestamp: lastDoc.timestamp,
                    });
                }
            } catch (error) {
                console.error(`Error querying for ${key}:`, error);
            }
        }

        return result;
    }
}