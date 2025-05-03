import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Privilege, PrivilegeDocument } from '../privileges/schemas/privilege.schema';
import { User, UserDocument } from '../users/schemas/user.schema';


@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name, 'prime_cold') private roleModel: Model<RoleDocument>,
    @InjectModel(Privilege.name, 'prime_cold') private privilegeModel: Model<PrivilegeDocument>,
    @InjectModel(User.name, 'prime_cold') private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new role with privilege validation
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, privileges } = createRoleDto;

    const existing = await this.roleModel.findOne({ name });
    if (existing) {
      throw new ConflictException('Role already exists');
    }

    // Validate privileges
    const objectIds = privileges?.map((id) => new Types.ObjectId(id)) || [];
    const validCount = await this.privilegeModel.countDocuments({ _id: { $in: objectIds } });

    if (objectIds.length !== validCount) {
      throw new BadRequestException('One or more privileges are invalid');
    }

    const role = new this.roleModel({ name, privileges: objectIds });
    return role.save();
  }

  /**
   * Get all roles, optionally just names & IDs, otherwise with populated privileges
   */
  async getAllRoles(selection?: string): Promise<Role[]> {
    if (selection === 'true') {
      return this.roleModel.find().select('_id name').exec();
    }

    return this.roleModel
      .find()
      .populate({
        path: 'privileges',
        model: 'Privilege',
        select: '_id name',
      })
      .exec();
  }

  /**
   * Update a role with validation
   */
  async updateRole(id: string, updateDto: UpdateRoleDto): Promise<Role> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid role ID');
    }

    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const { name, privileges } = updateDto;

    if (name && name !== role.name) {
      const nameTaken = await this.roleModel.findOne({ name });
      if (nameTaken) {
        throw new ConflictException('Role name already exists');
      }
      role.name = name;
    }

    if (privileges && privileges.length > 0) {
      const objectIds = privileges.map((id) => new Types.ObjectId(id));
      const validCount = await this.privilegeModel.countDocuments({ _id: { $in: objectIds } });

      if (validCount !== privileges.length) {
        throw new BadRequestException('One or more privileges are invalid');
      }

      role.privileges = objectIds;
    }

    return role.save();
  }

  /**
   * Delete role only if no user is assigned to it
   */
  async deleteRole(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid role ID');
    }

    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const isAssigned = await this.userModel.findOne({ role: new Types.ObjectId(id) });
    if (isAssigned) {
      throw new ConflictException('Role is assigned to users and cannot be deleted');
    }

    await this.roleModel.findByIdAndDelete(id);
    return { message: 'Role deleted successfully' };
  }
}
