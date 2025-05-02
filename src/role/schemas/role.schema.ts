import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ collection: 'role' })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Privilege' }] })
  privileges: Types.ObjectId[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
