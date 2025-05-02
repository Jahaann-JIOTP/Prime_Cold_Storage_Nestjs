import { 
  Controller, 
  Post, 
  Get,
  Patch,
  Delete,
  Param, 
  Body, 
  Query, 
  Req, 
  UseGuards, 
  UnauthorizedException 
} from '@nestjs/common';
import { RolesService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Create a new role (Only Admin can create)
   */
  @Post('add')
  @UseGuards(AuthGuard('jwt'))
  async createRole(@Body() createRoleDto: CreateRoleDto, @Req() req) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Only Admin can create roles');
    }
    return this.rolesService.createRole(createRoleDto);
  }

  /**
   * Get all roles (Any authenticated user can view)
   */
  @Get('all')
  @UseGuards(AuthGuard('jwt'))
  async getAllRoles(@Query('selection') selection?: string) {
    return this.rolesService.getAllRoles(selection);
  }

  /**
   * Update a role (Only Admin can update)
   */
  @Patch('update/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req
  ) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Only Admin can update roles');
    }
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  /**
   * Delete a role (Only Admin can delete)
   */
  @Delete('delete/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteRole(@Param('id') id: string, @Req() req) {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Only Admin can delete roles');
    }
    return this.rolesService.deleteRole(id);
  }
}
