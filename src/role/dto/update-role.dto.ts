import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  privileges?: string[]; // Array of privilege IDs
}
