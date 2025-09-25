// // src/dashboard/dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('consumption')
  async getConsumption(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    if (!startDate || !endDate) {
      return { error: 'start_date and end_date are required' };
    }
    return this.dashboardService.getConsumption(startDate, endDate);
  }
}
// @Get('today')
// async getTodayData() {
//   return await this.dashboardService.getTodayData();
// }}
