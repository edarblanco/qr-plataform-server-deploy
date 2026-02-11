import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../auth/enums/role.enum';

// Keys are intentionally lowercase (not the usual UPPER_CASE convention).
// NestJS registerEnumType uses the enum KEY as the GraphQL enum name, so uppercase
// keys like AVAILABLE would cause GraphQL to return "AVAILABLE" instead of "available",
// breaking frontend CSS classes (.availability-available, .availability-busy, etc.).
export enum UserAvailability {
  available = 'available',
  busy = 'busy',
  offline = 'offline',
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
    default: UserAvailability.offline
  })
  availability: UserAvailability;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastSeen: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
