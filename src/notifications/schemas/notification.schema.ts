import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { NotificationType } from '../enums/notification-type.enum';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Notification extends Document {
  id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  })
  type: NotificationType;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  data: Record<string, any>;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: false })
  sent: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Virtual 'id' field
NotificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Índices para optimizar queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
