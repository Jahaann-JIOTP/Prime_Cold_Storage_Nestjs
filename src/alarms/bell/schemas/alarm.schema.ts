import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Alarm extends Document {
  @Prop() source: string;     // note lowercase 'source'
  @Prop() status1: string;    // status field is named status1
  @Prop() current_time: string;
  @Prop() acknowledged: boolean;
  @Prop() in_bell: boolean;
}

export const AlarmSchema = SchemaFactory.createForClass(Alarm);
