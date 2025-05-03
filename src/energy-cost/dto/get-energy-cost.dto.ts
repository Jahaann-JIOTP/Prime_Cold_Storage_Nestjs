// src/energy-usage/dto/get-energy-usage.dto.ts

import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetEnergyCostDto {
  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;

  @IsArray()
  @IsNotEmpty()
  meterIds: string[];

  @IsOptional()
  @IsString()
  suffixes?: string;
}
