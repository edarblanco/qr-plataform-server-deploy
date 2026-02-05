import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateLeadInput {
  @Field()
  @IsNotEmpty()
  productId: string;

  @Field()
  @IsNotEmpty()
  clientName: string;

  @Field()
  @IsEmail()
  clientEmail: string;

  @Field({ nullable: true })
  @IsOptional()
  clientPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  message?: string;
}
