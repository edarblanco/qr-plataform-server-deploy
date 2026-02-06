import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class CreateNoteInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;
}
