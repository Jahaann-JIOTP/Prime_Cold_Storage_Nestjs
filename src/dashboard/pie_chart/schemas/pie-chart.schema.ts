// src/pie-chart/schemas/pie-chart.schema.ts
import { Schema, Document } from 'mongoose';

export const PieChartSchema = new Schema(
  {
    G2_U20_ACTIVE_ENERGY_IMPORT_KWH: Number,
    U_27_ACTIVE_ENERGY_IMPORT_KWH: Number,
    U_24_ACTIVE_ENERGY_IMPORT_KWH: Number, // Transformer 1
    U_25_ACTIVE_ENERGY_IMPORT_KWH: Number, // Transformer 2
    PLC_Date_Time: Date,
    UNIXtimestamp: Number,
  },
  {
    collection: 'GCL_ActiveTags',
  }
);

export interface PieChart extends Document {
  G2_U20_ACTIVE_ENERGY_IMPORT_KWH: number;
  U_27_ACTIVE_ENERGY_IMPORT_KWH: number;
  U_24_ACTIVE_ENERGY_IMPORT_KWH: number;
  U_25_ACTIVE_ENERGY_IMPORT_KWH: number;
  PLC_Date_Time: Date;
  UNIXtimestamp: number;
}
