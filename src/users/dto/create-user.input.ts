import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

@InputType()
export class CreateUserInput {
  @Field()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @Field()
  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @Field()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @Field(() => String)
  @IsEnum(Role, { message: 'Rol inválido' })
  role: Role;
}
