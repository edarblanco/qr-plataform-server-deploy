import {
  ObjectType,
  Field,
  ID,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { CartStatus } from '../schemas/cart-session.schema';

registerEnumType(CartStatus, {
  name: 'CartStatus',
});

@ObjectType()
export class CartItem {
  @Field()
  productId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;
}

@ObjectType()
export class CartSession {
  @Field(() => ID)
  id: string;

  @Field()
  sessionId: string;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => [CartItem])
  items: CartItem[];

  @Field(() => CartStatus)
  status: CartStatus;

  @Field(() => Float)
  totalValue: number;

  @Field()
  lastInteraction: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
