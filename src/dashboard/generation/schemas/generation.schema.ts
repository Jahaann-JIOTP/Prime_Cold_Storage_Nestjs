import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// If you want to define a custom collection name, you can specify it here.
@Schema({ collection: 'prime_historical_data' })  // Custom collection name if needed
export class Generation extends Document {
  @Prop()
  timestamp: string;

  @Prop()
  U1_Active_Energy_Total_Consumed?: number;

  @Prop()
  U2_Active_Energy_Total_Consumed?: number;

  
}

export const GenerationSchema = SchemaFactory.createForClass(Generation);
