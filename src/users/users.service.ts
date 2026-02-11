import { Injectable, ConflictException, NotFoundException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { PubSub } from 'graphql-subscriptions';
import { User, UserAvailability } from './schemas/user.schema';
import { Role } from '../auth/enums/role.enum';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UpdateUserRoleInput } from './dto/update-user-role.input';
import { UpdateAvailabilityInput } from './dto/update-availability.input';
import { UserStats } from './entities/user-stats.entity';
import { PUB_SUB } from '../pubsub/pubsub.provider';

export const USER_AVAILABILITY_CHANGED = 'userAvailabilityChanged';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(PUB_SUB) private pubSub: PubSub,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<User> {
    const { email, password, name, role } = createUserInput;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      name,
      role,
      isActive: true, // Default active
    });

    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async updateUser(id: string, updateUserInput: UpdateUserInput): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (updateUserInput.email && updateUserInput.email !== user.email) {
      const existing = await this.userModel.findOne({ email: updateUserInput.email });
      if (existing) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    if (updateUserInput.name) user.name = updateUserInput.name;
    if (updateUserInput.email) user.email = updateUserInput.email;
    if (updateUserInput.role) user.role = updateUserInput.role;
    // Password update should be a separate secure method if needed

    return user.save();
  }

  async toggleUserStatus(id: string, requestingUserId: string): Promise<User> {
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    user.isActive = !user.isActive;
    return user.save();
  }

  async deleteUser(id: string, requestingUserId: string): Promise<boolean> {
    // Soft delete implementation (same as deactivating)
    const user = await this.toggleUserStatus(id, requestingUserId);
    return !user.isActive;
  }

  async getUserStats(): Promise<UserStats> {
      const total = await this.userModel.countDocuments().exec();
      const byRoleData = await this.userModel.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
      ]).exec();

      const byRole = byRoleData.map(item => ({
          role: item._id,
          count: item.count
      }));

      return {
          total,
          byRole
      };
  }

  async updateUserRole(id: string, input: UpdateUserRoleInput, requestingUserId: string): Promise<User> {
      if (id === requestingUserId) {
          throw new ForbiddenException('No puedes cambiar tu propio rol');
      }
      const user = await this.findOne(id);
      user.role = input.role;
      return user.save();
  }

  async updateAvailability(userId: string, input: UpdateAvailabilityInput): Promise<User> {
      const user = await this.findOne(userId);
      user.availability = input.availability;
      user.lastSeen = new Date();
      const saved = await user.save();
      this.pubSub.publish(USER_AVAILABILITY_CHANGED, {
        userAvailabilityChanged: {
          id: saved._id.toString(),
          name: saved.name,
          availability: saved.availability,
        },
      });
      return saved;
  }

  async updateHeartbeat(userId: string): Promise<boolean> {
    await this.userModel.updateOne({ _id: userId }, { lastSeen: new Date() }).exec();
    return true;
  }

  // Runs every 5 minutes: marks users offline if no heartbeat in the last 10 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async markStaleUsersOffline(): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const staleUsers = await this.userModel.find({
      availability: { $ne: UserAvailability.offline },
      lastSeen: { $lt: tenMinutesAgo },
    }).exec();

    for (const user of staleUsers) {
      user.availability = UserAvailability.offline;
      const saved = await user.save();
      this.logger.log(`[Heartbeat] Marked ${saved.name} as offline (stale)`);
      this.pubSub.publish(USER_AVAILABILITY_CHANGED, {
        userAvailabilityChanged: {
          id: saved._id.toString(),
          name: saved.name,
          availability: saved.availability,
        },
      });
    }
  }

  async getAvailableVendedores(): Promise<User[]> {
      return this.userModel.find({ 
          role: Role.VENDEDOR, 
          availability: UserAvailability.available,
          isActive: true
      }).exec();
  }
}
