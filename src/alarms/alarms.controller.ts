import { Controller, Get, Query } from '@nestjs/common';
import { AlarmsService } from './alarms.service';

@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  // Existing method to get all alarms from the database
  @Get()
  async getAlarms() {
    const alarms = await this.alarmsService.checkAlarms();
    return { alarms };
  }

  

  // Method to fetch recent alarms based on the filter and show the data
  @Get('recent')
  async getRecentAlarms(@Query('filter') filter: string) {
    const filterValue = ['today', 'last7days', 'last15days', 'last30days'].includes(filter) ? filter : 'today';

    try {
      // Fetch and display recent alarms based on the filter
      const alarms = await this.alarmsService.checkRecentAlarms(filterValue);
      return { success: true, data: alarms };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
//   @Get('test-alarm')
// async insertTestAlarm() {
//   return this.alarmsService.testInsertAlarm();  // ← service method call
// }

}
