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
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { Privilege, PrivilegeDocument } from '../privileges/schemas/privilege.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';
// import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name, 'prime_cold') private userModel: Model<UserDocument>,
    @InjectModel(Role.name, 'prime_cold') private roleModel: Model<RoleDocument>,
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
// async getUserById(id: string): Promise<User> {
//   const user = await this.userModel.findById(id)
//     .populate({
//       path: 'role',
//       select: '_id name privileges',  // select role fields
//       populate: {
//         path: 'privileges',
//         model: 'Privilege',
//         select: '_id name',             // select privilege fields
//       },
//     })
//     .exec();

//   if (!user) {
//     throw new NotFoundException('User not found');
//   }

//   return user;
// }

async getUserById(id: string): Promise<any> {
  const user = await this.userModel.findById(id).exec();
  if (!user) {
    throw new NotFoundException('User not found');
  }

  const role = await this.roleModel.findOne({ name: user.role })
    .populate({
      path: 'privileges',
      select: '_id name',
    })
    .exec();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: role || null,
  };
}

}
