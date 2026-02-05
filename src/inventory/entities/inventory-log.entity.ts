import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class InventoryLog {
  @Field(() => ID)
  id: string;

  @Field()
  productId: string;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field()
  adminId: string;

  @Field(() => User, { nullable: true })
  admin?: User;

  @Field()
  action: string;

  @Field(() => GraphQLJSON)
  snapshot: any;

  @Field()
  createdAt: Date;
}
