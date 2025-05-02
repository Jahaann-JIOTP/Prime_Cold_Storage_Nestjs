import {
    Injectable,
    ConflictException,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { Privilege } from './schemas/privilege.schema';
  import { CreatePrivilegeDto } from './dto/create-privilege.dto';
  import { UpdatePrivilegeDto } from './dto/update-privilege.dto';
  
  @Injectable()
  export class PrivilegesService {
    constructor(
      @InjectModel(Privilege.name, 'prime_cold') private privilegeModel: Model<Privilege>,
    ) {}
  
    async createPrivilege(dto: CreatePrivilegeDto): Promise<Privilege> {
      const exists = await this.privilegeModel.findOne({ name: dto.name });
      if (exists) {
        throw new ConflictException('Privilege already exists');
      }
      return new this.privilegeModel(dto).save();
    }
  
    async getAllPrivileges(): Promise<Privilege[]> {
      return this.privilegeModel.find();
    }
  
    async updatePrivilege(id: string, dto: UpdatePrivilegeDto): Promise<Privilege> {
      const updated = await this.privilegeModel.findByIdAndUpdate(id, dto, { new: true });
      if (!updated) {
        throw new NotFoundException('Privilege not found');
      }
      return updated;
    }
  
    async deletePrivilege(id: string): Promise<{ message: string }> {
      const deleted = await this.privilegeModel.findByIdAndDelete(id);
      if (!deleted) {
        throw new NotFoundException('Privilege not found or already deleted');
      }
      return { message: 'Privilege deleted successfully' };
    }
  }
  