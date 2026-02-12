import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserAvailability } from '../schemas/user.schema';

// Register enum for GraphQL
registerEnumType(UserAvailability, {
  name: 'UserAvailability',
  description: 'Availability status of a user (vendedor)',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string;

  @Field(() => UserAvailability)
  availability: UserAvailability;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  lastSeen?: Date;

  @Field()
  createdAt: Date;
}
