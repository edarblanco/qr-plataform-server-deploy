import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class RoleCount {
  @Field()
  role: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class UserStats {
  @Field(() => Int)
  total: number;

  @Field(() => [RoleCount])
  byRole: RoleCount[];
}
