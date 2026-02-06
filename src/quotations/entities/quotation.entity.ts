import { ObjectType, Field, ID, Float, Int, registerEnumType } from '@nestjs/graphql';
import { Customer } from '../../customers/entities/customer.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { QuotationStatus } from '../schemas/quotation.schema';

// Register enum for GraphQL
registerEnumType(QuotationStatus, {
  name: 'QuotationStatus',
  description: 'Status of a quotation',
});

@ObjectType()
export class QuotationItem {
  @Field(() => ID)
  productId: string;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field()
  productName: string;

  @Field({ nullable: true })
  productSku?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  total: number;

  @Field({ nullable: true })
  notes?: string;
}

@ObjectType()
export class Quotation {
  @Field(() => ID)
  id: string;

  @Field()
  customerId: string;

  @Field(() => Customer, { nullable: true })
  customer?: Customer;

  @Field(() => ID, { nullable: true })
  leadId?: string;

  @Field(() => Lead, { nullable: true })
  lead?: Lead;

  @Field()
  createdBy: string;

  @Field(() => User, { nullable: true })
  createdByUser?: User;

  @Field(() => QuotationStatus)
  status: QuotationStatus;

  @Field(() => [QuotationItem])
  items: QuotationItem[];

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  total: number;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  validUntil?: Date;

  @Field({ nullable: true })
  sentAt?: Date;

  @Field({ nullable: true })
  acceptedAt?: Date;

  @Field({ nullable: true })
  rejectedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
