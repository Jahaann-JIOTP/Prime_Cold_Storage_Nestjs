import { Controller, Get, Query } from '@nestjs/common';
import { CompressorRuntimeService } from './compressor-runtime.service';

@Controller('compressor-runtime')
export class CompressorRuntimeController {
  constructor(private readonly compressorService: CompressorRuntimeService) {}

  @Get('daily-seconds')
  async getDailySeconds(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.compressorService.getDailyTotalSeconds(startDate, endDate);
  }
}

