import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum LeadStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class Lead extends Document {
  id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', default: null })
  customerId: string;

  @Prop({ required: true })
  clientName: string;

  @Prop({ required: true })
  clientEmail: string;

  @Prop()
  clientPhone: string;

  @Prop()
  message: string;

  @Prop({ type: String, enum: LeadStatus, default: LeadStatus.PENDING })
  status: LeadStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  assignedTo: string;

  @Prop({ type: Number, default: null })
  queuePosition: number;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Date, default: null })
  assignedAt: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

// Add virtual 'id' field that maps to '_id'
LeadSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Text index for search across client info and message
LeadSchema.index({ clientName: 'text', clientEmail: 'text', message: 'text' });
