import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsNumber, IsMongoId } from 'class-validator';

/**
 * DTO para cada item del carrito en un lead.
 * Contiene snapshot del producto al momento de agregarlo.
 */
@InputType()
export class CreateLeadItemInput {
  @Field()
  @IsMongoId({ message: 'productId debe ser un ID de MongoDB válido' })
  productId: string;

  @Field()
  @IsNotEmpty()
  productName: string;

  @Field()
  @IsNotEmpty()
  productSku: string;

  @Field({ nullable: true })
  @IsOptional()
  productBrand?: string;

  @Field()
  @IsNumber()
  productPrice: number;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;
}
