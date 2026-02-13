import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class CartItemInput {
  @Field()
  productId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;
}
