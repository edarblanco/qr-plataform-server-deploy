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
export class InventoryLog extends Document {
  id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  adminId: string;

  @Prop({ required: true })
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'ROLLBACK'

  @Prop({ type: Object, required: true })
  snapshot: Record<string, any>; // Estado del producto en ese momento

  @Prop({ type: Date })
  createdAt: Date;
}

export const InventoryLogSchema = SchemaFactory.createForClass(InventoryLog);

// Add virtual 'id' field that maps to '_id'
InventoryLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
