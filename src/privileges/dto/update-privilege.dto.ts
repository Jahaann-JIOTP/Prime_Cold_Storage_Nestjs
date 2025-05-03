import { IsOptional, IsString } from 'class-validator';

export class UpdatePrivilegeDto {
  @IsString()
  @IsOptional()
  name?: string;
}
