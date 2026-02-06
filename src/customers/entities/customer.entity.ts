import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Lead } from '../../leads/entities/lead.entity';
import { CustomerNote } from './customer-note.entity';

// Declarar CustomerStats ANTES de Customer para evitar error de referencia
@ObjectType()
export class CustomerStats {
  @Field(() => Int)
  totalLeads: number;

  @Field(() => Int)
  totalQuotations: number;

  @Field(() => Int)
  acceptedQuotations: number;

  @Field({ nullable: true })
  lastActivityDate?: Date;
}

@ObjectType()
export class Customer {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  company?: string;

  @Field(() => [Lead], { nullable: true })
  leads?: Lead[];

  @Field(() => [CustomerNote], { nullable: true })
  notes?: CustomerNote[];

  @Field(() => CustomerStats, { nullable: true })
  stats?: CustomerStats;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
