import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivilegesController } from './privileges.controller';
import { PrivilegesService } from './privileges.service';
import { Privilege, PrivilegeSchema } from './schemas/privilege.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Privilege.name, schema: PrivilegeSchema }],
      'prime_cold', // Make sure you're using the correct DB connection
    ),
  ],
  controllers: [PrivilegesController],
  providers: [PrivilegesService],
  exports: [PrivilegesService],
})
export class PrivilegesModule {}
