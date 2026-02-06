import { InputType, Field, Float } from '@nestjs/graphql';
import { IsOptional, IsNumber, IsString, IsArray, Min } from 'class-validator';
import { QuotationItemInput } from './create-quotation.input';

@InputType()
export class UpdateQuotationInput {
  @Field(() => [QuotationItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  items?: QuotationItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  validUntil?: Date;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}
