import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlarmDocument = Alarm & Document;

@Schema({ collection: 'alarms' })
export class Alarm {
  @Prop()
  Source: string;

  @Prop()
  Status: string;

  @Prop()
  Value: number;

  @Prop()
  Time: Date;

  @Prop()
  db_value: number;

  @Prop()
  url_value: number;

  @Prop()
  status1: string;

  @Prop({ default: 1 })
  alarm_count: number;
  
  @Prop({ type: String, default: null })
  current_time?: Date;

  @Prop({ type: Date, default: null }) // ✅ FIXED
  end_time: Date | null;
  
 
  
}

export const AlarmSchema = SchemaFactory.createForClass(Alarm);
