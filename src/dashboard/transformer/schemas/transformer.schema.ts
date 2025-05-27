import { Schema, Document } from 'mongoose';

export type transformerDocument = Document & {
  timestamp: Date;
  U1_Active_Energy_Total_Consumed: number;
  // other fields...
};

export const transformerSchema = new Schema({
  timestamp: { type: Date, required: true },
  U1_Active_Energy_Total_Consumed: { type: Number },
  // other fields...
}, {
  collection: 'prime_historical_data'  // <- this is critical, match your actual MongoDB collection name here
});
