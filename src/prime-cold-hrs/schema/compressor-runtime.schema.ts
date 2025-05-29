import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompressorRuntimeDocument = CompressorRuntime & Document;

@Schema({ collection: 'prime_cold_hrs' }) // adjust collection name if needed
export class CompressorRuntime {
  @Prop() U5_On_Time?: string;
  @Prop() U5_Off_Time?: string;

  @Prop() U3_On_Time?: string;
  @Prop() U3_Off_Time?: string;

   @Prop() U4_On_Time?: string;
  @Prop() U4_Off_Time?: string;
}

export const CompressorRuntimeSchema = SchemaFactory.createForClass(CompressorRuntime);
