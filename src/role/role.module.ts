import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesService } from './role.service';
import { RolesController } from './role.controller';
import { Role, RoleSchema } from './schemas/role.schema';
import { Privilege, PrivilegeSchema } from '../privileges/schemas/privilege.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Role.name, schema: RoleSchema },
        { name: Privilege.name, schema: PrivilegeSchema },
        { name: User.name, schema: UserSchema },
      ],
      'prime_cold' // 👈 Custom connection name
    )
  ],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
