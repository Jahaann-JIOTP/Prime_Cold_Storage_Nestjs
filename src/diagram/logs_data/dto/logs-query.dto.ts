import { IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class LogsQueryDto {
  @IsIn(['current', 'voltage', 'active_power'])
  type: string;

  @IsString()
  @IsNotEmpty()
  meters: string;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;
}
