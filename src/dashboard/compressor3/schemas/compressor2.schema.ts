import { Schema, Document } from 'mongoose';

export const Compressor3Schema = new Schema({
  timestamp: { type: Date, required: true },
  energyValue1: { type: Number, required: true },
  energyValue2: { type: Number, required: true },
  // You can add other energy-related fields as necessary
});

export interface Solar extends Document {
  timestamp: Date;
  energyValue1: number;
  energyValue2: number;
  // Add other fields as necessary
}
