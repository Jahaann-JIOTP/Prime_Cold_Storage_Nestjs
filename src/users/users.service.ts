// src/users/users.service.ts

import { 
  Injectable, 
  ConflictException, 
  InternalServerErrorException, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name, 'prime_cold') 
    private readonly userModel: Model<User>,
  ) {}

  /**
   * ✅ Register a new user
   */
  async registerUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      return await newUser.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      console.error('Unexpected error:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  /**
   * ✅ Find user by email (for login, auth validate)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).populate('role').exec();
  }

  /**
   * ✅ Reset user's password
   */
  async resetPassword(email: string, newPassword: string): Promise<string> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return 'Password reset successfully';
  }

  /**
   * ✅ Get all users (with roles populated)
   */
  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().populate('role').exec();
  }

  /**
   * ✅ Update user by ID
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If updating password, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return await user.save();
  }

  /**
   * ✅ Delete user by ID
   */
  async deleteUser(id: string): Promise<User | null> {
    return await this.userModel.findByIdAndDelete(id).exec();
  }

  /**
   * ✅ Get single user by ID (for profile)
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).populate('role').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
