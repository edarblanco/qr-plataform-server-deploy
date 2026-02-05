import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  sku: string;

  @Field({ nullable: true })
  brand?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  qrCode?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
