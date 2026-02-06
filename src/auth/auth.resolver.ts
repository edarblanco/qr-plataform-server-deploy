import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthPayload } from './entities/auth-payload.entity';
import { User } from '../users/entities/user.entity';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { GqlAuthGuard } from './guards/gql-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 registrations per hour
  async register(
    @Args('input') registerInput: RegisterInput,
  ): Promise<AuthPayload> {
    return this.authService.register(registerInput);
  }

  @Mutation(() => AuthPayload)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute (brute force protection)
  async login(@Args('input') loginInput: LoginInput): Promise<AuthPayload> {
    return this.authService.login(loginInput);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@Context() context): Promise<User> {
    const user = context.req.user;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      availability: user.availability,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
