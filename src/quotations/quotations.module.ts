import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotationsService } from './quotations.service';
import { QuotationsResolver, QuotationItemResolver } from './quotations.resolver';
import { Quotation, QuotationSchema } from './schemas/quotation.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quotation.name, schema: QuotationSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    PdfModule,
  ],
  providers: [QuotationsService, QuotationsResolver, QuotationItemResolver],
  exports: [QuotationsService],
})
export class QuotationsModule {}
