import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Post('logout')
  async logout(@Request() req) {
    // JWT logout is frontend-based, just return a success message
    return { message: 'Logout successful. Please remove token from frontend.' };
  }

  @Post('reset-password')
async resetPassword(@Body() body: { email: string; newPassword: string }) {
  return this.authService.resetPassword(body.email, body.newPassword);
}

}
