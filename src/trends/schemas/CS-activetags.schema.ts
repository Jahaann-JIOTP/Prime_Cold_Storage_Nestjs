// src/trends/schemas/cs-activetags.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false }) // <- allows undefined fields (like dynamic meter keys)
export class CSActiveTags extends Document {
  @Prop()
  timestamp: string;
}

export const CSActiveTagsSchema = SchemaFactory.createForClass(CSActiveTags);
