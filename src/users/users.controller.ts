// src/users/users.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * ✅ Register a new user (Only Admin allowed)
   */
  @Post('register')
// @UseGuards(AuthGuard('jwt'))
async register(@Body() createUserDto: CreateUserDto, @Req() req) {
  console.log('req.user:', req.user); 

  // const currentUserRole = req.user?.role || 'User';
  
  // if (currentUserRole !== 'admin') {
  //   throw new UnauthorizedException('Only Admin can create users');
  // }

  return this.usersService.registerUser(createUserDto);
}


  /**
   * ✅ Get all users with their roles
   */
  @Get('all')
  @UseGuards(AuthGuard('jwt'))
  async getAllUsers(@Req() req) {
    const currentUserRole = req.user?.role || 'User';
    if (currentUserRole !== 'admin') {
      throw new UnauthorizedException('Only Admin can view all users');
    }
    return this.usersService.getAllUsers();
  }

  /**
   * ✅ Update a user (Only Admin allowed)
   */
  @Patch('update/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Only Admin can update users');
    }
    const updatedUser = await this.usersService.updateUser(id, updateUserDto);
    return {
      message: 'User updated successfully!',
      updatedUser,
    };
  }

  /**
   * ✅ Delete a user (Only Admin allowed)
   */
  @Delete('delete/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteUser(@Param('id') id: string, @Req() req) {
    if (req.user?.role !== 'admin') {
      throw new BadRequestException('Only Admin can delete users');
    }
    const user = await this.usersService.deleteUser(id);
    if (!user) {
      throw new UnauthorizedException('Unable to delete user');
    }
    return { message: 'User has been deleted successfully' };
  }

  /**
   * ✅ Get logged-in user's profile (roles + permissions)
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    const userId = req.user?.userId;
    const profile = await this.usersService.getUserById(userId);
    return profile;
  }
}
