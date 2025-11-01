import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EnergyUsage } from './schemas/energy-usage.schema';
import { EnergyUsageDto } from './dto/energy-usage.dto';
import * as moment from 'moment-timezone';

@Injectable()
export class EnergyUsageService {
    constructor(
        @InjectModel(EnergyUsage.name) private usageModel: Model<EnergyUsage>,
    ) { }

    async getEnergyUsage(dto: EnergyUsageDto): Promise<any[]> {
        const { start_date, end_date, start_time, end_time, meterIds, suffixes } = dto;
        const suffixArray = suffixes || [];

        // Handle time formats - ensure they have proper format
        const formatTime = (time: string | undefined): string => {
            if (!time) return '00:00:00.000';
            if (time.length === 5) return `${time}:00.000`; // HH:mm -> HH:mm:00.000
            if (time.length === 8) return `${time}.000`;    // HH:mm:ss -> HH:mm:ss.000
            return time; // Assume it's already in HH:mm:ss.SSS format
        };

        const defaultStartTime = formatTime(start_time);
        const defaultEndTime = formatTime(end_time);

        const results: any[] = [];

        // Special handling for end_time = "00:00" or "23:59:59" - include next day's first reading
        const isEndTimeMidnight = end_time === '00:00' || end_time === '00:00:00' || end_time === '00:00:00.000';
        const isEndTimeEndOfDay = end_time === '23:55' || end_time === '23:55:59' || end_time === '23:55:59.999';
        const shouldIncludeNextDay = isEndTimeMidnight || isEndTimeEndOfDay;

        console.log('Query Parameters:', {
            start_date,
            end_date,
            start_time,
            end_time,
            isEndTimeMidnight,
            isEndTimeEndOfDay,
            shouldIncludeNextDay,
            meterIds,
            suffixes: suffixArray
        });

        // Loop through each day in the range
        const startMoment = moment.tz(start_date, 'YYYY-MM-DD', 'Asia/Karachi');
        const endMoment = moment.tz(end_date, 'YYYY-MM-DD', 'Asia/Karachi');

        const current = startMoment.clone();

        while (current.isSameOrBefore(endMoment, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            const isFirstDay = current.isSame(startMoment, 'day');

            // For each day, calculate the proper start and end times
            let dayStart, dayEnd;

            if (isFirstDay) {
                // First day - use the provided start_time
                dayStart = moment.tz(`${dateStr} ${defaultStartTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');
            } else {
                // Subsequent days - always start at the same start_time (could be 00:00:00 or any specific time)
                dayStart = moment.tz(`${dateStr} ${defaultStartTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');
            }

            if (shouldIncludeNextDay) {
                // For ALL days when end_time is midnight or end of day, include next day's first reading
                const nextDay = current.clone().add(1, 'day');
                dayEnd = moment.tz(`${nextDay.format('YYYY-MM-DD')} 00:00:00.000`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi')
                    .add(1, 'minute'); // Include the first reading of next day
            } else {
                // For specific time ranges, use the exact end time for each day
                dayEnd = moment.tz(`${dateStr} ${defaultEndTime}`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi');
            }

            const dayStartISO = dayStart.toISOString(true);
            const dayEndISO = dayEnd.toISOString(true);

            console.log(`\nProcessing date: ${dateStr}`, {
                isFirstDay,
                shouldIncludeNextDay,
                dayStart: dayStart.format('YYYY-MM-DD HH:mm:ss.SSS'),
                dayEnd: dayEnd.format('YYYY-MM-DD HH:mm:ss.SSS'),
                dayStartISO,
                dayEndISO
            });

            for (let i = 0; i < meterIds.length; i++) {
                const meterId = meterIds[i];

                let suffix = '';
                if (meterId === 'U2') {
                    suffix = 'Active_Energy_Total';
                    if (!suffixArray.includes('Active_Energy_Total')) {
                        console.log(`Skipping ${meterId} - Active_Energy_Total not in suffixes`);
                        continue;
                    }
                } else {
                    suffix = suffixArray[i] || suffixArray[0];
                }

                // Skip if no suffix is available
                if (!suffix) {
                    console.log(`Skipping ${meterId} - no suffix available`);
                    continue;
                }

                const key = `${meterId}_${suffix}`;

                console.log(`Querying for ${key} from ${dayStartISO} to ${dayEndISO}`);

                try {
                    // Find earliest record for this day
                    const firstDoc = await this.usageModel.findOne(
                        {
                            timestamp: { $gte: dayStartISO, $lte: dayEndISO },
                            [key]: { $exists: true, $ne: null }
                        },
                        { [key]: 1, timestamp: 1 },
                    ).sort({ timestamp: 1 }).lean();

                    // Find latest record for this day
                    const lastDoc = await this.usageModel.findOne(
                        {
                            timestamp: { $gte: dayStartISO, $lte: dayEndISO },
                            [key]: { $exists: true, $ne: null }
                        },
                        { [key]: 1, timestamp: 1 },
                    ).sort({ timestamp: -1 }).lean();

                    console.log(`Results for ${key}:`, {
                        firstDoc: firstDoc ? {
                            value: firstDoc[key],
                            timestamp: firstDoc.timestamp
                        } : null,
                        lastDoc: lastDoc ? {
                            value: lastDoc[key],
                            timestamp: lastDoc.timestamp
                        } : null
                    });

                    if (
                        firstDoc &&
                        lastDoc &&
                        firstDoc.hasOwnProperty(key) &&
                        lastDoc.hasOwnProperty(key)
                    ) {
                        const startVal = firstDoc[key];
                        const endVal = lastDoc[key];
                        const consumption = endVal - startVal;

                        results.push({
                            date: dateStr,
                            meterId,
                            suffix,
                            consumption,
                            startValue: startVal,
                            endValue: endVal,
                            startTimestamp: firstDoc.timestamp,
                            endTimestamp: lastDoc.timestamp,
                        });

                        console.log(`Added result for ${key}:`, {
                            date: dateStr,
                            consumption,
                            startValue: startVal,
                            endValue: endVal
                        });
                    } else {
                        console.log(`No valid data found for ${key}`);
                    }
                } catch (error) {
                    console.error(`Error querying for ${key}:`, error);
                }
            }

            // Move to next day
            current.add(1, 'day');
            console.log(`Moving to next day: ${current.format('YYYY-MM-DD')}`);
        }

        console.log('\nFinal results count:', results.length);
        console.log('Final results:', JSON.stringify(results, null, 2));

        return results;
    }
}