import mongoose, { Schema, Document } from 'mongoose';

// Define a TypeScript interface for the document
export interface IActiveTags extends Document {
  timestamp: Date;
  G2_U20_ACTIVE_ENERGY_IMPORT_KWH?: number;
  U_27_ACTIVE_ENERGY_IMPORT_KWH?: number;
}

// Define the schema
export const ActiveTagsSchema = new Schema<IActiveTags>(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true, // Helps improve performance on time-based queries
    },
    G2_U20_ACTIVE_ENERGY_IMPORT_KWH: {
      type: Number,
      default: 0,
    },
    U_27_ACTIVE_ENERGY_IMPORT_KWH: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'GCL_ActiveTags', // Your collection name
    strict: true, // Only allow defined fields
    timestamps: false, // Don't auto-create createdAt/updatedAt
  }
);

// Export the model
const ActiveTags = mongoose.model<IActiveTags>('ActiveTags', ActiveTagsSchema);
export { ActiveTags };
