import { Controller, Get, Query } from '@nestjs/common';
import { ConVsProService } from './con_vs_pro.service';

@Controller()
export class ConVsProController {
  constructor(private readonly conVsProService: ConVsProService) {}

  @Get('con_vs_pro')
  async getConVsPro(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('label') label: string
  ) {
    return this.conVsProService.getPowerData(startDate, endDate, label);
  }
}
