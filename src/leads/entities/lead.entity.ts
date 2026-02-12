import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { LeadStatus } from '../schemas/lead.schema';

// Register enum for GraphQL
registerEnumType(LeadStatus, {
  name: 'LeadStatus',
  description: 'Status of a lead',
});

/**
 * GraphQL ObjectType para items individuales del lead
 */
@ObjectType()
export class LeadItem {
  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field()
  productSku: string;

  @Field({ nullable: true })
  productBrand?: string;

  @Field()
  productPrice: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  addedAt: Date;
}

@ObjectType()
export class Lead {
  @Field(() => ID)
  id: string;

  // DEPRECATED - mantener por compatibilidad
  @Field({ nullable: true })
  productId?: string;

  @Field(() => Product, { nullable: true })
  product?: Product;

  // NUEVO - Array de productos del carrito
  @Field(() => [LeadItem])
  items: LeadItem[];

  // NUEVO - Descripción del lead
  @Field({ nullable: true })
  description?: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

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

  @Field(() => ID, { nullable: true })
  assignedTo?: string;

  @Field(() => User, { nullable: true })
  assignedToUser?: User;

  @Field({ nullable: true })
  queuePosition?: number;

  @Field()
  priority: number;

  @Field({ nullable: true })
  assignedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
