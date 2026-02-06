import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Schema({ _id: false })
export class QuotationItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop()
  productSku: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  total: number;

  @Prop()
  notes: string;
}

const QuotationItemSchema = SchemaFactory.createForClass(QuotationItem);

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
export class Quotation extends Document {
  id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', default: null })
  customerId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Lead', default: null })
  leadId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: string;

  @Prop({ type: String, enum: QuotationStatus, default: QuotationStatus.DRAFT })
  status: QuotationStatus;

  @Prop({ type: [QuotationItemSchema], default: [] })
  items: QuotationItem[];

  @Prop({ required: true, default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true, default: 0 })
  total: number;

  @Prop()
  notes: string;

  @Prop({ type: Date })
  validUntil: Date;

  @Prop({ type: Date, default: null })
  sentAt: Date;

  @Prop({ type: Date, default: null })
  acceptedAt: Date;

  @Prop({ type: Date, default: null })
  rejectedAt: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const QuotationSchema = SchemaFactory.createForClass(Quotation);

// Add virtual 'id' field that maps to '_id'
QuotationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Indexes for efficient queries
QuotationSchema.index({ customerId: 1, createdAt: -1 });
QuotationSchema.index({ createdBy: 1, status: 1 });
QuotationSchema.index({ status: 1, validUntil: 1 });
