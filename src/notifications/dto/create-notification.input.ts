import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { NotificationType } from '../enums/notification-type.enum';

@InputType()
export class CreateNotificationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  body: string;

  @Field()
  @IsEnum(NotificationType)
  type: NotificationType;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  data?: Record<string, any>;
}
