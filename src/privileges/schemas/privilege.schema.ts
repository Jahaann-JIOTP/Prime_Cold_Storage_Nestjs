import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PrivilegeDocument = HydratedDocument<Privilege>;

@Schema({ collection: 'privileges' })
export class Privilege {
  @Prop({ required: true, unique: true })
  name: string;
}

export const PrivilegeSchema = SchemaFactory.createForClass(Privilege);
