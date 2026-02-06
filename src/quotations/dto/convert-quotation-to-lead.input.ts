import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

@InputType()
export class ConvertQuotationToLeadInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  quotationId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  clientEmail: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  message?: string;
}
