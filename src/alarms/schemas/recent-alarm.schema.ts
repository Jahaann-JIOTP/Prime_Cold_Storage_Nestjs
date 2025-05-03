import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecentAlarmDocument = RecentAlarm & Document;

@Schema({
  collection: 'PCS_recent_alarms',
  timestamps: false // ✅ If you want createdAt / updatedAt, set to true
})
export class RecentAlarm {
  @Prop({ required: true })
  Source: string;

  @Prop({ required: true })
  Status: string;

  @Prop({ type: String, default: null }) // Keep as String
  start_time: string | null;

  @Prop({ type: String, default: null }) // Keep as String
  end_time: string | null;

  @Prop({ type: String, default: 'Ongoing' })
  duration: string;
}

export const RecentAlarmSchema = SchemaFactory.createForClass(RecentAlarm);
