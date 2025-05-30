import { IsIn, IsString } from 'class-validator';

export class GetSolarDto {
  @IsString()
  @IsIn(['today', 'week', 'month', 'year'], {
    message: 'value must be one of: today, week, month, or year',
  })
  value: string;
}
