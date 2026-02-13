import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ScanEvent {
  @Field(() => ID)
  id: string;

  @Field()
  productId: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  ip?: string;

  @Field({ nullable: true })
  sessionId?: string;

  @Field()
  createdAt: Date;
}
