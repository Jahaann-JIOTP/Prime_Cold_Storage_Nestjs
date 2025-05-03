import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    UnauthorizedException,
    NotFoundException,
    ConflictException,
  } from '@nestjs/common';
  import { PrivilegesService } from './privileges.service';
  import { CreatePrivilegeDto } from './dto/create-privilege.dto';
  import { UpdatePrivilegeDto } from './dto/update-privilege.dto';
  import { AuthGuard } from '@nestjs/passport';
  
  @Controller('privileges')
  export class PrivilegesController {
    constructor(private readonly privilegesService: PrivilegesService) {}
  
    /**
     * Create a new privilege (JWT Protected)
     */
    @Post('add')
    @UseGuards(AuthGuard('jwt'))
    async createPrivilege(@Body() createPrivilegeDto: CreatePrivilegeDto) {
      console.log('Received Privilege DTO:', createPrivilegeDto); // 👈 yeh add karo
      return this.privilegesService.createPrivilege(createPrivilegeDto);
    }
    
  
    /**
     * Get all privileges (JWT Protected)
     */
    @Get('all')
    @UseGuards(AuthGuard('jwt'))
    async getAllPrivileges() {
      return this.privilegesService.getAllPrivileges();
    }
  
    /**
     * Update a privilege (JWT Protected)
     */
    @Patch('update/:id')
    @UseGuards(AuthGuard('jwt'))
    async updatePrivilege(
      @Param('id') id: string,
      @Body() updatePrivilegeDto: UpdatePrivilegeDto,
    ) {
      return this.privilegesService.updatePrivilege(id, updatePrivilegeDto);
    }
  
    /**
     * Delete a privilege (JWT Protected)
     */
    @Delete('delete/:id')
    @UseGuards(AuthGuard('jwt'))
    async deletePrivilege(@Param('id') id: string) {
      return this.privilegesService.deletePrivilege(id);
    }
  }
  