// src/pie-chart/schemas/pie-chart.schema.ts
import { Schema, Document } from 'mongoose';

export const PieChartSchema = new Schema(
  {
    U2_Active_Energy_Total_Consumed: Number,
    U1_Active_Energy_Total_Consumed: Number,
    U1_Active_Energy_Total_Supplied: Number, // Transformer 1
    // Transformer 2
    PLC_Date_Time: Date,
    UNIXtimestamp: Number,
  },
  {
    collection: 'prime_historical_data',
  }
);

export interface PieChart extends Document {
  U2_Active_Energy_Total_Consumed: number;
  U1_Active_Energy_Total_Consumed: number;
  U1_Active_Energy_Total_Supplied: number;
 
  PLC_Date_Time: Date;
  UNIXtimestamp: number;
}
