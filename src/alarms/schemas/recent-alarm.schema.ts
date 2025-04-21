// src/schemas/recent-alarm.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecentAlarmDocument = RecentAlarm & Document;

@Schema({ collection: 'recent_alarms' })
export class RecentAlarm {
  @Prop({ required: true })
  Source: string;

  @Prop({ required: true })
  Status: string;

  @Prop()
  start_time: string;

  @Prop()
  end_time: string;

  @Prop()
  duration: string;
}

export const RecentAlarmSchema = SchemaFactory.createForClass(RecentAlarm);
