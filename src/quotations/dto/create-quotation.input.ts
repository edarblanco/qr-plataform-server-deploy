import { InputType, Field, ID, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsNumber, IsString, IsArray, Min } from 'class-validator';

@InputType()
export class QuotationItemInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  productId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  productName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  productSku?: string;

  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class CreateQuotationInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  customerId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  leadId?: string;

  @Field(() => [QuotationItemInput])
  @IsArray()
  items: QuotationItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  validUntil?: Date;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}
