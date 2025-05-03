import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
      UsersModule,
      JwtModule.register({
        secret: 'PCS', // use env in real apps
        signOptions: { expiresIn: '1d' },
      }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
  })
  export class AuthModule {}
  

