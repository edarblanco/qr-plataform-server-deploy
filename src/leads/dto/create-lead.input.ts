import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLeadItemInput } from './create-lead-item.input';

@InputType()
export class CreateLeadInput {
  // DEPRECATED - mantener por compatibilidad con formato antiguo
  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId({ message: 'productId debe ser un ID de MongoDB válido' })
  productId?: string;

  // NUEVO - Array de productos del carrito
  @Field(() => [CreateLeadItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLeadItemInput)
  items?: CreateLeadItemInput[];

  // NUEVO - Descripción del lead
  @Field({ nullable: true })
  @IsOptional()
  description?: string;

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
