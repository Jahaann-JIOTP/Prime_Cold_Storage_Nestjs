// src/bell/dto/create-bell.dto.ts
import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateBellDto {
  @IsString()
  source: string;

  @IsString()
  status: string;

  @IsNumber()
  value: number;

  @IsNumber()
  url_value: number;

  @IsNumber()
  db_value: number;

  @IsString()
  bell_status: string;

  @IsDate()
  time: Date;

  @IsOptional()
  @IsDate()
  end_time?: Date;
}
