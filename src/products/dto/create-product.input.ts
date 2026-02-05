import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  sku: string;

  @Field({ nullable: true })
  @IsOptional()
  brand?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  stock: number;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  image?: string;
}
