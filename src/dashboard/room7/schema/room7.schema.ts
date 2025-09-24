import { Schema, Document } from 'mongoose';

export type room7Document = Document & {
  timestamp: Date;
  U6_Active_Energy_Total_Consumed: number;
  // other fields...
};

export const room7Schema = new Schema(
  {
    timestamp: { type: Date, required: true },
    U6_Active_Energy_Total_Consumed: { type: Number },
    // other fields...
  },
  {
    collection: 'prime_historical_data', // <- this is critical, match your actual MongoDB collection name here
  },
);
