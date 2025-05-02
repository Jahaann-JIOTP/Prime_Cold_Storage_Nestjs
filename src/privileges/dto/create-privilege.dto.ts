import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePrivilegeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
