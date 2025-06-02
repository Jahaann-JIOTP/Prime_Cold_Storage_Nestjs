import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

import { Types } from 'mongoose';

@Schema({ collection: 'users' })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

@Prop({ required: true })
  role: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Privilege' }] })
  privileges: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);






