import mongoose, { Schema, Document } from 'mongoose';

// Define a TypeScript interface for the document
export interface IActiveTags extends Document {
  timestamp: Date;
  U2_Active_Energy_Total_Consumed?: number;
  
}

// Define the schema
export const ActiveTagsSchema = new Schema<IActiveTags>(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true, // Helps improve performance on time-based queries
    },
    U2_Active_Energy_Total_Consumed: {
      type: Number,
      default: 0,
    },
    
  },
  {
    collection: 'prime_historical_data', // Your collection name
    strict: true, // Only allow defined fields
    timestamps: false, // Don't auto-create createdAt/updatedAt
  }
);

// Export the model
const ActiveTags = mongoose.model<IActiveTags>('ActiveTags', ActiveTagsSchema);
export { ActiveTags };
