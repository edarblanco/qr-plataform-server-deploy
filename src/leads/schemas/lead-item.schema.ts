import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

/**
 * Schema para representar cada producto individual en un lead.
 * Almacena un snapshot del producto al momento de agregarlo al carrito.
 */
@Schema({ _id: false })
export class LeadItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  productName: string; // Snapshot del nombre al momento de agregar

  @Prop({ required: true })
  productSku: string; // Snapshot del SKU

  @Prop()
  productBrand?: string;

  @Prop({ required: true })
  productPrice: number; // Snapshot del precio

  @Prop()
  notes?: string; // Notas específicas del cliente sobre este producto

  @Prop({ type: Date, default: Date.now })
  addedAt: Date;
}

export const LeadItemSchema = SchemaFactory.createForClass(LeadItem);
