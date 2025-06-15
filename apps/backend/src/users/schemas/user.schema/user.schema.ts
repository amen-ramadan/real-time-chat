import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    match: /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  })
  email: string;

  @Prop({ required: true, minlength: 8 })
  password: string;

  @Prop()
  profilePicture?: string;

  @Prop({ default: '' })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;
