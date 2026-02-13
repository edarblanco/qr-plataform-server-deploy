import { ObjectType, Field, Float, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class UserConversion {
  @Field(() => ID)
  userId: string;

  @Field()
  userName: string;

  @Field(() => Int)
  totalLeads: number;

  @Field(() => Int)
  completedLeads: number;

  @Field(() => Float)
  conversionRate: number;
}
