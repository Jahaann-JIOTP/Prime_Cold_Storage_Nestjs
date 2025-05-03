
import { IsIn, IsString } from 'class-validator';
export class GenerationDto {
    @IsString()
    @IsIn(['today', 'weekly', 'monthly', 'yearly'], {
      message: 'value must be one of: today, week, month, or year',
    })
    value: string;
  }
  