import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CLOSED = 'CLOSED',
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

  @Prop({ required: true })
  clientName: string;

  @Prop({ required: true })
  clientEmail: string;

  @Prop()
  clientPhone: string;

  @Prop()
  message: string;

  @Prop({ type: String, enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

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
