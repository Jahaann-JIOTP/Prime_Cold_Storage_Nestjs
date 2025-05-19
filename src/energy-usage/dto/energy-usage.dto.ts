import { IsArray, IsString, IsDateString, IsOptional } from 'class-validator';

export class EnergyUsageDto {
  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsArray()
  meterIds: string[];

  @IsOptional()  // optional if sometimes suffixes is not provided
  @IsArray()
  @IsString({ each: true })  // validate each element of suffixes is a string
  suffixes?: string[];
}
