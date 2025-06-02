import { IsArray, IsOptional, IsString, Matches } from 'class-validator';

export class GetEnergyCostDto {
  @IsString()
  start_date: string;

  @IsOptional()
  @IsString()
  // Validate time format HH:mm or HH:mm:ss optionally
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'start_time must be in HH:mm or HH:mm:ss format',
  })
  start_time?: string;

  @IsString()
  end_date: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'end_time must be in HH:mm or HH:mm:ss format',
  })
  end_time?: string;

  @IsArray()
  meterIds: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suffixes?: string[];
}
