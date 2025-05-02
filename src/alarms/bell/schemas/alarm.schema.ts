import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlarmDocument = Alarm & Document;

@Schema()
export class Alarm {
  @Prop()
  Source: string;

  @Prop()
  status1: string;

  @Prop()
  Value: number;

  @Prop()
  db_value: number;

  @Prop()
  url_value: number;

  @Prop()
  alarm_count: number;

  @Prop()
  current_time: Date;

  @Prop()
  end_time: Date;
}

export const AlarmSchema = SchemaFactory.createForClass(Alarm);
