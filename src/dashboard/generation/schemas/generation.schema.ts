import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// If you want to define a custom collection name, you can specify it here.
@Schema({ collection: 'GCL_ActiveTags' })  // Custom collection name if needed
export class Generation extends Document {
  @Prop()
  timestamp: string;

  @Prop()
  G2_U20_ACTIVE_ENERGY_IMPORT_KWH?: number;

  @Prop()
  U_27_ACTIVE_ENERGY_IMPORT_KWH?: number;

  @Prop()
  U_24_ACTIVE_ENERGY_IMPORT_KWH?: number;

  @Prop()
  U_25_ACTIVE_ENERGY_IMPORT_KWH?: number;

  @Prop()
  G1_U16_ACTIVE_ENERGY_IMPORT_KWH?: number;

  @Prop()
  G1_U17_ACTIVE_ENERGY_IMPORT_KWH?: number;

  @Prop()
  G1_U18_ACTIVE_ENERGY_IMPORT_KWH?: number;

  @Prop()
  G1_U19_ACTIVE_ENERGY_IMPORT_KWH?: number;
}

export const GenerationSchema = SchemaFactory.createForClass(Generation);
