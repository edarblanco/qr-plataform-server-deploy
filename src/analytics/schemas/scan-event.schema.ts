import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ScanEventDocument = ScanEvent & Document;

@Schema({ timestamps: true })
export class ScanEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: false })
  source?: string; // e.g., 'qr', 'direct', 'campaign'

  @Prop({ required: false })
  userAgent?: string;

  @Prop({ required: false })
  ip?: string;

  @Prop({ required: false })
  sessionId?: string; // To link with anonymous sessions or users
}

export const ScanEventSchema = SchemaFactory.createForClass(ScanEvent);
