import { InputType, Field } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

@InputType()
export class UpdateUserRoleInput {
  @Field(() => String)
  @IsEnum(Role)
  role: Role;
}
