import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BellDocument = Bell & Document;

@Schema({collection: 'bell'})
export class Bell {
  @Prop()
  source: string;

  @Prop()
  status: string;

  @Prop()
  value: number;

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

export const BellSchema = SchemaFactory.createForClass(Bell);
