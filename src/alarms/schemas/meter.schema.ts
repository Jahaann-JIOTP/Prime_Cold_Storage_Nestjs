import * as mongoose from 'mongoose';  // Add this line to import mongoose
import { Schema, Document } from 'mongoose';

export interface MeterDocument extends Document {
  Source: string;
  Status: string;
  Value: number;
}

export const MeterSchema = new Schema<MeterDocument>({
  Source: { type: String, required: true },
  Status: { type: String, required: true },
  Value: { type: Number, required: true },
}, {
  collection: 'meter_data',  // Ensure this points to the correct collection
});

export const Meter = mongoose.model<MeterDocument>('Meter', MeterSchema, 'meter_data');  // Use mongoose to define the model
