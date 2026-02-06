import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserStats } from './entities/user-stats.entity';
import { UpdateUserRoleInput } from './dto/update-user-role.input';
import { UpdateAvailabilityInput } from './dto/update-availability.input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_READ)
  async findAll(): Promise<User[]> {
    const users = await this.usersService.findAll();
    return users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      availability: user.availability,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }

  // ... findOne ...

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_UPDATE)
  async updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    const user = await this.usersService.updateUser(id, input);
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

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_UPDATE)
  async toggleUserStatus(
    @Args('id', { type: () => ID }) id: string,
    @Context() context,
  ): Promise<User> {
    const requestingUserId = context.req.user._id.toString();
    const user = await this.usersService.toggleUserStatus(id, requestingUserId);
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


  @Query(() => User, { name: 'user', nullable: true })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_READ)
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
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

  @Query(() => UserStats, { name: 'userStats' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_READ)
  async getUserStats(): Promise<UserStats> {
    return this.usersService.getUserStats();
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_UPDATE)
  async updateUserRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserRoleInput,
    @Context() context,
  ): Promise<User> {
    const requestingUserId = context.req.user._id.toString();
    const user = await this.usersService.updateUserRole(id, input, requestingUserId);
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

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_DELETE)
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
    @Context() context,
  ): Promise<boolean> {
    const requestingUserId = context.req.user._id.toString();
    return this.usersService.deleteUser(id, requestingUserId);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async updateAvailability(
    @Args('input') input: UpdateAvailabilityInput,
    @Context() context,
  ): Promise<User> {
    const userId = context.req.user._id.toString();
    const user = await this.usersService.updateAvailability(userId, input);
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

  @Query(() => [User], { name: 'availableVendedores' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USERS_READ)
  async getAvailableVendedores(): Promise<User[]> {
    const users = await this.usersService.getAvailableVendedores();
    return users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      availability: user.availability,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }
}
