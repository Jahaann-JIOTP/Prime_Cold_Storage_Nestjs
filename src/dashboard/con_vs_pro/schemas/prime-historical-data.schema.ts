// prime-historical-data.schema.ts
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({collection:'prime_historical_data'})
export class PrimeHistoricalData {
  @Prop({ required: true })
  timestamp: string;

  @Prop()
  U1_Active_Energy_Total_Consumed?: number;

  @Prop()
  U2_Active_Energy_Total?: number;

  @Prop()
  U3_Active_Energy_Total_Consumed?: number;

  @Prop()
  U4_Active_Energy_Total_Consumed?: number;

  @Prop()
  U5_Active_Energy_Total_Consumed?: number;
}

export type PrimeHistoricalDataDocument = PrimeHistoricalData & Document;
export const PrimeHistoricalDataSchema = SchemaFactory.createForClass(PrimeHistoricalData);
