import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class TopProduct {
  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field(() => Int)
  requestCount: number;
}

@ObjectType()
export class MonthlyGoals {
  @Field(() => Int)
  leadsGoal: number;

  @Field(() => Int)
  leadsAchieved: number;

  @Field(() => Float)
  conversionGoal: number;

  @Field(() => Float)
  conversionAchieved: number;
}

@ObjectType()
export class Analytics {
  @Field(() => Int)
  totalLeads: number;

  @Field(() => Float)
  conversionRate: number;

  @Field(() => [TopProduct])
  topProducts: TopProduct[];

  @Field(() => Float)
  averageResponseTime: number;

  @Field(() => MonthlyGoals)
  monthlyGoals: MonthlyGoals;
}
