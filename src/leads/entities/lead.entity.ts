import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { LeadStatus } from '../schemas/lead.schema';

// Register enum for GraphQL
registerEnumType(LeadStatus, {
  name: 'LeadStatus',
  description: 'Status of a lead',
});

@ObjectType()
export class Lead {
  @Field(() => ID)
  id: string;

  @Field()
  productId: string;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field()
  clientName: string;

  @Field()
  clientEmail: string;

  @Field({ nullable: true })
  clientPhone?: string;

  @Field({ nullable: true })
  message?: string;

  @Field(() => LeadStatus)
  status: LeadStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
