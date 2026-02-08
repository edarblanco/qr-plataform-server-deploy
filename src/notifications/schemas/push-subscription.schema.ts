import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
export class PushSubscription extends Document {
  id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, unique: true })
  endpoint: string;

  @Prop({
    type: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    required: true,
  })
  keys: {
    p256dh: string;
    auth: string;
  };

  @Prop()
  userAgent: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  lastUsedAt: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const PushSubscriptionSchema =
  SchemaFactory.createForClass(PushSubscription);

// Virtual 'id' field
PushSubscriptionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Índices
PushSubscriptionSchema.index({ userId: 1 });
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
PushSubscriptionSchema.index({ isActive: 1 });
