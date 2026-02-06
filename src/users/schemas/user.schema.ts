import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../auth/enums/role.enum';

export enum UserAvailability {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.ADMIN
  })
  role: Role;

  @Prop({
    type: String,
    enum: Object.values(UserAvailability),
    default: UserAvailability.OFFLINE
  })
  availability: UserAvailability;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
