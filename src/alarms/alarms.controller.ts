// src/alarms/alarms.controller.ts
import { Controller, Get, Post, Query  } from '@nestjs/common';
import { AlarmsService } from './alarms.service';

@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Get()
  async getAlarms() {
    const alarms = await this.alarmsService.checkAlarms();
    return { alarms };
  }
  @Get('fetch')
  fetchFromLocalAPI() {
    return this.alarmsService.fetchAndSaveAlarmsFromLocalhost();
  }
  @Get('recent')
  async getRecentAlarms(@Query('filter') filter: string) {
    // Default filter is 'today' if no filter is provided
    const filterValue = filter || 'today';
    try {
      const alarms = await this.alarmsService.getRecentAlarms(filterValue);
      return { success: true, data: alarms };
    } catch (error) {
      return { success: false, message: error.message };
    }
}

}
