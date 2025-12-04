import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Energy, EnergyDocument } from './schemas/energy.schema';
import * as moment from 'moment-timezone';
@Injectable()
export class EnergyService
{
    constructor (
        @InjectModel( Energy.name ) private energyModel: Model<EnergyDocument>,
    ) { }

    async getConsumption ( start: string, end: string )
    {
        const meterIds = [
            'U1',
            'U2',
            'U3',
            'U4',
            'U5',
            'U6',
            'U7',
            'U8',
            'U9',
            'U10',
            'U11',
            'U12',
        ];
        const suffixes: string[] = [
            'Active_Energy_Total_Consumed',
            'Active_Energy_Total',
            'Active_Energy_Total_Supplied',
        ];

        // Energy Sources
        const solarKeys = [ 'U2_Active_Energy_Total_Consumed' ];
        const WapdaKeys = [ 'U1_Active_Energy_Total_Consumed' ];
        const Wapda2Keys = [ 'U1_Active_Energy_Total_Supplied' ];

        // Compressors
        const Compressor1Key = 'U3_Active_Energy_Total_Consumed';
        const Compressor2Key = 'U4_Active_Energy_Total_Consumed';
        const Compressor3Key = 'U5_Active_Energy_Total_Consumed';

        // Rooms mapping
        const RoomKeys = {
            Room1: 'U7_Active_Energy_Total_Consumed',
            Room2: 'U8_Active_Energy_Total_Consumed',
            Room3: 'U9_Active_Energy_Total_Consumed',
            Room4: 'U10_Active_Energy_Total_Consumed',
            Room5: 'U11_Active_Energy_Total_Consumed',
            Room6: 'U12_Active_Energy_Total_Consumed',
            Room7: 'U6_Active_Energy_Total_Consumed',
        };
        const startMoment = moment.tz( start, 'YYYY-MM-DD', 'Asia/Karachi' ).startOf( 'day' );
        const endMoment = moment.tz( end, 'YYYY-MM-DD', 'Asia/Karachi' )
            .add( 1, 'day' )
            .add( 1, 'minute' );
        // Query
        const matchStage = {
            timestamp: {
                $gte: startMoment.toISOString( true ),
                $lte: endMoment.toISOString( true ),
            },
        };
        console.log( 'Match Stage:', matchStage );
        // Projection
        const projection: { [ key: string ]: number } = { timestamp: 1 };
        for ( const id of meterIds )
        {
            for ( const suffix of suffixes )
            {
                projection[ `${ id }_${ suffix }` ] = 1;
            }
        }

        const result = await this.energyModel.aggregate( [
            { $match: matchStage },
            { $project: projection },
            { $sort: { timestamp: 1 } },
        ] );

        // First & Last values
        const firstValues = {};
        const lastValues = {};

        for ( const doc of result )
        {
            meterIds.forEach( ( id ) =>
            {
                suffixes.forEach( ( suffix ) =>
                {
                    const key = `${ id }_${ suffix }`;
                    if ( doc[ key ] !== undefined )
                    {
                        if ( !firstValues[ key ] ) firstValues[ key ] = doc[ key ];
                        lastValues[ key ] = doc[ key ];
                    }
                } );
            } );
        }

        // Consumption
        const consumption = {};
        Object.keys( firstValues ).forEach( ( key ) =>
        {
            consumption[ key ] = lastValues[ key ] - firstValues[ key ];
        } );

        const sumGroup = ( keys: string[] ) =>
            keys.reduce( ( sum, key ) => sum + ( consumption[ key ] || 0 ), 0 );

        const solar = sumGroup( solarKeys );
        const Wapda = sumGroup( WapdaKeys );
        const Wapda2 = sumGroup( Wapda2Keys );

        const totalGeneration = solar + Wapda;

        // Compressors
        const Compressor1 = consumption[ Compressor1Key ] || 0;
        const Compressor2 = consumption[ Compressor2Key ] || 0;
        const Compressor3 = consumption[ Compressor3Key ] || 0;
        const production = Compressor1 + Compressor2 + Compressor3;

        // Rooms
        const roomConsumption: Record<string, number> = {};
        Object.keys( RoomKeys ).forEach( ( room ) =>
        {
            roomConsumption[ room ] = consumption[ RoomKeys[ room ] ] || 0;
        } );
        const totalRooms = Object.values( roomConsumption ).reduce(
            ( a, b ) => a + b,
            0,
        );

        // ✅ Total Consumption (Compressors + Rooms)
        const totalConsumption = production + totalRooms;

        // Unaccountable
        const unaccountable = totalGeneration - totalConsumption;

        return {
            total_consumption: {
                Total_Generation: totalGeneration.toFixed( 5 ),
                Total_Consumption: totalConsumption.toFixed( 5 ),
                Solar: solar.toFixed( 5 ),
                Wapda_Import: Wapda.toFixed( 5 ),
                Wapda_Export: Wapda2.toFixed( 5 ),

                // Compressors
                Compressor1: Compressor1.toFixed( 5 ),
                Compressor2: Compressor2.toFixed( 5 ),
                Compressor3: Compressor3.toFixed( 5 ),
                Sum_of_compressors: production.toFixed( 5 ),

                // Rooms
                ...Object.fromEntries(
                    Object.entries( roomConsumption ).map( ( [ k, v ] ) => [ k, v.toFixed( 5 ) ] ),
                ),
                Sum_of_rooms: totalRooms.toFixed( 5 ),

                // Unaccountable
                Unaccountable_Energy: unaccountable.toFixed( 5 ),
            },
        };
    }
    private readonly keyMapping: { [ key: string ]: string } = {
        'room1': 'U7_Total_Active_Power',
        'room2': 'U8_Total_Active_Power',
        'room3': 'U9_Total_Active_Power',
        'room4': 'U10_Total_Active_Power',
        'room5': 'U11_Total_Active_Power',
        'room6': 'U12_Total_Active_Power',
        'room7': 'U6_Total_Active_Power',
        'compressor1': 'U3_Total_Active_Power',
        'compressor2': 'U5_Total_Active_Power',
        'condensorpump': 'U4_Total_Active_Power'
    };

    private readonly energyConsumptionMapping: { [ key: string ]: string } = {
        'room1': 'U7_Active_Energy_Total_Consumed',
        'room2': 'U8_Active_Energy_Total_Consumed',
        'room3': 'U9_Active_Energy_Total_Consumed',
        'room4': 'U10_Active_Energy_Total_Consumed',
        'room5': 'U11_Active_Energy_Total_Consumed',
        'room6': 'U12_Active_Energy_Total_Consumed',
        'room7': 'U6_Active_Energy_Total_Consumed',
        'compressor1': 'U3_Active_Energy_Total_Consumed',
        'compressor2': 'U5_Active_Energy_Total_Consumed',
        'condensorpump': 'U4_Active_Energy_Total_Consumed'
    };

    private readonly displayNames: { [ key: string ]: string } = {
        'room1': 'Room 1',
        'room2': 'Room 2',
        'room3': 'Room 3',
        'room4': 'Room 4',
        'room5': 'Room 5',
        'room6': 'Room 6',
        'room7': 'Room 7',
        'compressor1': 'Compressor 1',
        'compressor2': 'Compressor 2',
        'condensorpump': 'Condensor Pump (1+2)'
    };

    async getComputedHoursVsKWH ( startDate: string, endDate: string, meterId: string[] )
    {
        const results: any[] = [];

        // Use the same timezone handling as getEnergyUsage
        const startMoment = moment.tz( startDate, 'YYYY-MM-DD', 'Asia/Karachi' );
        const endMoment = moment.tz( endDate, 'YYYY-MM-DD', 'Asia/Karachi' );
        const current = startMoment.clone();

        // Default times (same as getEnergyUsage)
        const defaultStartTime = '00:00:00.000';
        const defaultEndTime = '23:59:59.999';

        // Special handling for end time - include next day's first reading
        const shouldIncludeNextDay = true; // Always include next day's first reading for this function

        console.log( 'Query Parameters:', {
            start_date: startDate,
            end_date: endDate,
            shouldIncludeNextDay,
            meterIds: meterId
        } );

        while ( current.isSameOrBefore( endMoment, 'day' ) )
        {
            const dateStr = current.format( 'YYYY-MM-DD' );
            const isFirstDay = current.isSame( startMoment, 'day' );

            // For each day, calculate the proper start and end times (same logic as getEnergyUsage)
            let dayStart, dayEnd;

            if ( isFirstDay )
            {
                // First day - use the provided start_time
                dayStart = moment.tz( `${ dateStr } ${ defaultStartTime }`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi' );
            } else
            {
                // Subsequent days - always start at the same start_time
                dayStart = moment.tz( `${ dateStr } ${ defaultStartTime }`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi' );
            }

            if ( shouldIncludeNextDay )
            {
                // Include next day's first reading
                const nextDay = current.clone().add( 1, 'day' );
                dayEnd = moment.tz( `${ nextDay.format( 'YYYY-MM-DD' ) } 00:00:00.000`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi' )
                    .add( 1, 'minute' ); // Include the first reading of next day
            } else
            {
                // For specific time ranges, use the exact end time for each day
                dayEnd = moment.tz( `${ dateStr } ${ defaultEndTime }`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Karachi' );
            }

            const dayStartISO = dayStart.toISOString( true );
            const dayEndISO = dayEnd.toISOString( true );

            console.log( `\nProcessing date: ${ dateStr }`, {
                isFirstDay,
                shouldIncludeNextDay,
                dayStart: dayStart.format( 'YYYY-MM-DD HH:mm:ss.SSS' ),
                dayEnd: dayEnd.format( 'YYYY-MM-DD HH:mm:ss.SSS' ),
                dayStartISO,
                dayEndISO
            } );

            // Process each meter ID
            for ( const meter of meterId )
            {
                const powerField = this.keyMapping[ meter.toLowerCase() ];
                const energyField = this.energyConsumptionMapping[ meter.toLowerCase() ];

                if ( !powerField || !energyField )
                {
                    console.log( `Skipping ${ meter } - no field mapping available` );
                    continue;
                }

                try
                {
                    // Get all documents for this meter where active power > 0
                    const documents = await this.energyModel.find(
                        {
                            timestamp: { $gte: dayStartISO, $lte: dayEndISO },
                            [ powerField ]: { $exists: true, $ne: null, $gt:0 }
                        },
                        {
                            [ powerField ]: 1,
                            [ energyField ]: 1,
                            timestamp: 1
                        },
                    ).sort( { timestamp: 1 } ).lean();

                    console.log( `Found ${ documents.length } documents for ${ meter } on ${ dateStr }` );

                    if ( documents.length >= 2 )
                    {
                        let totalRuntimeSeconds = 0;
                        let segmentStartTime: moment.Moment | null = null;

                        // Calculate total runtime when active power > 40
                        for ( let i = 0; i < documents.length; i++ )
                        {
                            const doc = documents[ i ];

                            if ( doc[ powerField ] > 0 )
                            {
                                // Start of a running segment
                                if ( segmentStartTime === null )
                                {
                                    segmentStartTime = moment( doc.timestamp );
                                }

                                // If this is the last document or next document has power = 0, end the segment
                                if ( i === documents.length - 1 || documents[ i + 1 ][ powerField ] <= 0 )
                                {
                                    if ( segmentStartTime !== null )
                                    {
                                        const segmentEndTime = moment( doc.timestamp );
                                        totalRuntimeSeconds += segmentEndTime.diff( segmentStartTime, 'seconds' );
                                        segmentStartTime = null;
                                    }
                                }
                            }
                        }

                        // Find earliest and latest energy records for this day (same approach as getEnergyUsage)
                        const firstEnergyDoc = await this.energyModel.findOne(
                            {
                                timestamp: { $gte: dayStartISO, $lte: dayEndISO },
                                [ energyField ]: { $exists: true, $ne: null }
                            },
                            { [ energyField ]: 1, timestamp: 1 },
                        ).sort( { timestamp: 1 } ).lean();

                        const lastEnergyDoc = await this.energyModel.findOne(
                            {
                                timestamp: { $gte: dayStartISO, $lte: dayEndISO },
                                [ energyField ]: { $exists: true, $ne: null }
                            },
                            { [ energyField ]: 1, timestamp: 1 },
                        ).sort( { timestamp: -1 } ).lean();

                        console.log( `Energy results for ${ meter }:`, {
                            firstDoc: firstEnergyDoc ? {
                                value: firstEnergyDoc[ energyField ],
                                timestamp: firstEnergyDoc.timestamp
                            } : null,
                            lastDoc: lastEnergyDoc ? {
                                value: lastEnergyDoc[ energyField ],
                                timestamp: lastEnergyDoc.timestamp
                            } : null
                        } );

                        if ( firstEnergyDoc && lastEnergyDoc )
                        {
                            const startEnergy = firstEnergyDoc[ energyField ] || 0;
                            const endEnergy = lastEnergyDoc[ energyField ] || 0;
                            const consumption = endEnergy - startEnergy;

                            // Get display name
                            const displayName = this.displayNames[ meter.toLowerCase() ] || meter;

                            results.push( {
                                date: dateStr,
                                keyType: meter,
                                name: displayName,
                                runtime_seconds: totalRuntimeSeconds,
                                runtime_hours: parseFloat( ( totalRuntimeSeconds / 3600 ).toFixed( 3 ) ),
                                consumption: parseFloat( consumption.toFixed( 2 ) ),
                                startEnergyValue: startEnergy,
                                endEnergyValue: endEnergy,
                                startTimestamp: firstEnergyDoc.timestamp,
                                endTimestamp: lastEnergyDoc.timestamp,
                                documentCount: documents.length,
                                segmentsWithPower: documents.filter( d => d[ powerField ] > 0 ).length
                            } );

                            console.log( `Added result for ${ meter }:`, {
                                date: dateStr,
                                runtime_seconds: totalRuntimeSeconds,
                                consumption,
                                startEnergyValue: startEnergy,
                                endEnergyValue: endEnergy
                            } );
                        } else
                        {
                            const displayName = this.displayNames[ meter.toLowerCase() ] || meter;
                            results.push( {
                                date: dateStr,
                                keyType: meter,
                                name: displayName,
                                runtime_seconds: 0,
                                runtime_hours: 0,
                                consumption: 0,
                                startEnergyValue: 0,
                                endEnergyValue: 0,
                                error: 'No energy consumption data found'
                            } );
                        }
                    } else
                    {
                        const displayName = this.displayNames[ meter.toLowerCase() ] || meter;
                        results.push( {
                            date: dateStr,
                            keyType: meter,
                            name: displayName,
                            runtime_seconds: 0,
                            runtime_hours: 0,
                            consumption: 0,
                            startEnergyValue: 0,
                            endEnergyValue: 0,
                            error: documents.length === 0 ? 'No energy consumption data found' : 'Insufficient data points'
                        } );
                    }
                } catch ( error )
                {
                    const displayName = this.displayNames[ meter.toLowerCase() ] || meter;
                    results.push( {
                        date: dateStr,
                        keyType: meter,
                        name: displayName,
                        runtime_seconds: 0,
                        runtime_hours: 0,
                        consumption: 0,
                        error: error.message
                    } );
                }
            }

            // Move to next day
            current.add( 1, 'day' );
            console.log( `Moving to next day: ${ current.format( 'YYYY-MM-DD' ) }` );
        }

        console.log( '\nFinal results count:', results.length );

        // Return in the required response structure
        return {
            success: true,
            data: results
        };
    }
}