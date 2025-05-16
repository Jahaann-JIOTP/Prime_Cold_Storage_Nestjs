import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BellDocument = Bell & Document;

// @Schema({collection: 'bell'})
@Schema()
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
  current_time: string;

  @Prop()
  end_time: string;
}

export const BellSchema = SchemaFactory.createForClass(Bell);
