import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: User.name, schema: UserSchema },
         { name: Role.name, schema: RoleSchema },
      ],
      'prime_cold' // <--- add this
    ),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
