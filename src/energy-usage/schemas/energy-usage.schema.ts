import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'prime_historical_data' })
export class EnergyUsage extends Document {
  @Prop()
  timestamp: string;

  // Dynamic keys like M1_ACTIVE_ENERGY_IMPORT_KWH will be handled at runtime
}

export const EnergyUsageSchema = SchemaFactory.createForClass(EnergyUsage);