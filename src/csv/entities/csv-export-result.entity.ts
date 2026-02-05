import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CSVExportResult {
  @Field()
  filename: string;

  @Field()
  url: string;

  @Field()
  content: string;
}
