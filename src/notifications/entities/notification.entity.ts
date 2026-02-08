import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  body: string;

  @Field()
  type: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  data?: Record<string, any>;

  @Field()
  read: boolean;

  @Field()
  sent: boolean;

  @Field({ nullable: true })
  readAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
