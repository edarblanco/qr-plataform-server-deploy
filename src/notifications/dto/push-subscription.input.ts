import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class PushSubscriptionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  auth: string;
}
