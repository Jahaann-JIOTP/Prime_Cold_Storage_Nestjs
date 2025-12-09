import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

    async validateUser(email: string, password: string): Promise<any> {
       
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    // ✅ toObject works after casting
    const { password: _, ...userWithoutPass } = (user as UserDocument).toObject();
    return userWithoutPass;
  }

    async login(user: UserDocument) {
        // Check if the email is locked
        // if (user.email === 'automation@jiotp.com') {
        //     return {
        //         message: 'Access Restricted. Due To Pending Payment.',
        //         access_token: null,
        //     };
        // }

        const payload = {
            email: user.email,
            sub: (user._id as any).toString(),
        };

        return {
            message: 'Login successful!',
            access_token: this.jwtService.sign(payload),
        };
    }


  async resetPassword(email: string, newPassword: string): Promise<string> {
    return this.usersService.resetPassword(email, newPassword);
  }
}
