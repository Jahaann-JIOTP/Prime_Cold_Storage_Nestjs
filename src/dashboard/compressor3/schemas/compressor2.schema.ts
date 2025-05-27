import { Schema, Document } from 'mongoose';

export type Compressor2Document = Document & {
  timestamp: Date;
  U5_Active_Energy_Total_Consumed: number;
  // other fields...
};

export const Compressor2Schema = new Schema({
  timestamp: { type: Date, required: true },
  U5_Active_Energy_Total_Consumed: { type: Number },
  // other fields...
}, {
  collection: 'prime_historical_data'  // <- this is critical, match your actual MongoDB collection name here
});
