import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
export class CustomerNote extends Document {
  id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true })
  customerId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isImportant: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const CustomerNoteSchema = SchemaFactory.createForClass(CustomerNote);

// Add virtual 'id' field that maps to '_id'
CustomerNoteSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Index for fast customer lookups
CustomerNoteSchema.index({ customerId: 1, createdAt: -1 });
