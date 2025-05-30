import { Schema, Document } from 'mongoose';

export type SolarDocument = Document & {
  timestamp: Date;
  U2_Active_Energy_Total: number;
  // other fields...
};

export const SolarSchema = new Schema({
  timestamp: { type: Date, required: true },
  U2_Active_Energy_Total: { type: Number },
  // other fields...
}, {
  collection: 'prime_historical_data'  // <- this is critical, match your actual MongoDB collection name here
});
