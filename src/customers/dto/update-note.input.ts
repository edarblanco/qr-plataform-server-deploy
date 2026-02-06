import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateNoteInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;
}
