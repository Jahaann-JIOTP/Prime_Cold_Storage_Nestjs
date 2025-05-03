import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsArray()
  @IsOptional()
  privileges?: string[]; // Array of privilege IDs
}
