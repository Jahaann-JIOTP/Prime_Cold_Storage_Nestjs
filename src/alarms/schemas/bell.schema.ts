// schemas/bell.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'bells' })
export class Bell {
  @Prop()
  Source: string;

  @Prop()
  Status: string;

  @Prop()
  Time: Date;

  @Prop()
  db_value: number;

  @Prop()
  url_value: number;

  @Prop()
  status1: string;

  @Prop()
  alarm_count: number;

  @Prop()
  current_time: Date;

  @Prop()
  end_time: Date;
}

export type BellDocument = Bell & Document;
export const BellSchema = SchemaFactory.createForClass(Bell);
