import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class CustomerNote {
  @Field(() => ID)
  id: string;

  @Field()
  customerId: string;

  @Field()
  createdBy: string;

  @Field(() => User, { nullable: true })
  createdByUser?: User;

  @Field()
  content: string;

  @Field()
  isImportant: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
