import { IsArray, IsString, IsDateString, IsOptional } from 'class-validator';

export class EnergyUsageDto {
  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsString()
  start_time?: string; // e.g., "00:00" or "13:30"

  @IsOptional()
  @IsString()
  end_time?: string; // e.g., "23:59:59.999"

  @IsArray()
  meterIds: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suffixes?: string[];
}
