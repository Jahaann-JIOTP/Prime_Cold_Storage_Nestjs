import { IsArray, IsString, IsDateString } from 'class-validator';

export class EnergyUsageDto {
  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsArray()
  meterIds: string[];

  @IsString()
  suffixes: string;
}
