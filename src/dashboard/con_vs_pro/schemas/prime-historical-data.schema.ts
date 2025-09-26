import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'prime_historical_data' })
export class PrimeHistoricalData {
  @Prop({ required: true })
  timestamp: Date; // <-- Better to store as Date, not string

  // Wapda & Solar
  @Prop()
  U1_Active_Energy_Total_Consumed?: number;

  @Prop()
  U2_Active_Energy_Total?: number;

  // Compressors
  @Prop()
  U3_Active_Energy_Total_Consumed?: number;

  @Prop()
  U4_Active_Energy_Total_Consumed?: number;

  @Prop()
  U5_Active_Energy_Total_Consumed?: number;

  // Rooms
  @Prop()
  U6_Active_Energy_Total_Consumed?: number;

  @Prop()
  U7_Active_Energy_Total_Consumed?: number;

  @Prop()
  U8_Active_Energy_Total_Consumed?: number;

  @Prop()
  U9_Active_Energy_Total_Consumed?: number;

  @Prop()
  U10_Active_Energy_Total_Consumed?: number;

  @Prop()
  U11_Active_Energy_Total_Consumed?: number;

  @Prop()
  U12_Active_Energy_Total_Consumed?: number;
}

export type PrimeHistoricalDataDocument = PrimeHistoricalData & Document;
export const PrimeHistoricalDataSchema =
  SchemaFactory.createForClass(PrimeHistoricalData);
