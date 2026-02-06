import { InputType, Field } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { UserAvailability } from '../schemas/user.schema';

@InputType()
export class UpdateAvailabilityInput {
  @Field(() => String)
  @IsEnum(UserAvailability)
  availability: UserAvailability;
}
