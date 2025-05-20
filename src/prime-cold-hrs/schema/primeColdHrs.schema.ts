import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrimeColdHrsDocument = PrimeColdHrs & Document;

@Schema({ collection: 'prime_cold_hrs' })
export class PrimeColdHrs {
  @Prop()
  U3_OnTime: string;

  @Prop()
  U3_total_seconds: number;

  @Prop()
  U4_OnTime: string;

  @Prop()
  U4_total_seconds: number;

  @Prop()
  U5_OnTime: string;

  @Prop()
  U5_total_seconds: number;

  @Prop()
  date: Date;

  @Prop()
  _msgid: string;
}

export const PrimeColdHrsSchema = SchemaFactory.createForClass(PrimeColdHrs);
