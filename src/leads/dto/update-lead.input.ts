import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum } from 'class-validator';
import { LeadStatus } from '../schemas/lead.schema';

@InputType()
export class UpdateLeadInput {
  @Field(() => LeadStatus, { nullable: true })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
