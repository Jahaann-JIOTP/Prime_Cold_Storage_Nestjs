import { IsOptional, IsString } from 'class-validator';

export class GetMeterDto {
  @IsOptional()
  @IsString()
  meter?: string;
}
