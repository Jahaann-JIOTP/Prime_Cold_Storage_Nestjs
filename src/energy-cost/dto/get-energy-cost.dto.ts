import { IsArray, IsOptional, IsString } from 'class-validator';

export class GetEnergyCostDto {
  @IsString()
  start_date: string;

  @IsString()
  end_date: string;

  @IsArray()
  meterIds: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suffixes?: string[];
}
