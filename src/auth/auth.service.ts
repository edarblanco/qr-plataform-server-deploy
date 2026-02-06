import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users/schemas/user.schema';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './entities/auth-payload.entity';
import { EmailService } from '../email/email.service';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerInput: RegisterInput): Promise<AuthPayload> {
    const { email, password, name } = registerInput;

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
      role: Role.ADMIN,
    });

    const savedUser = await user.save();

    // Send welcome email (async, no await to not block)
    this.emailService
      .sendWelcomeEmail({
        email: savedUser.email,
        name: savedUser.name,
      })
      .catch((err) => console.error('Error sending welcome email:', err));

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
    });

    return {
      token,
      user: {
        id: savedUser._id.toString(),
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        availability: savedUser.availability,
        isActive: savedUser.isActive,
        createdAt: savedUser.createdAt,
      },
    };
  }

  async login(loginInput: LoginInput): Promise<AuthPayload> {
    const { email, password } = loginInput;

    // Find user
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo. Contacte al administrador.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        availability: user.availability,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user;
  }
}
