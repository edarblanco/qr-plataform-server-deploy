import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class SquareVariation {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  sku: string;

  @Field(() => Float)
  price: number;
}

@ObjectType()
export class SquareProduct {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field()
  sku: string;

  @Field(() => Int, { defaultValue: 0 })
  stock: number;

  @Field(() => [SquareVariation])
  variations: SquareVariation[];
}
