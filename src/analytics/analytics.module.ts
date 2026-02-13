import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import {
  Quotation,
  QuotationSchema,
} from '../quotations/schemas/quotation.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ScanEvent, ScanEventSchema } from './schemas/scan-event.schema';
import { CartSession, CartSessionSchema } from './schemas/cart-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: Quotation.name, schema: QuotationSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ScanEvent.name, schema: ScanEventSchema },
      { name: CartSession.name, schema: CartSessionSchema },
    ]),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
