import { Controller, Get, Query } from '@nestjs/common';
import { PrimeColdHrsService } from './prime-cold-hrs.service';
import { PrimeColdHrs } from './schema/primeColdHrs.schema';

@Controller('prime-cold-hrs')
export class PrimeColdHrsController {
  constructor(private readonly primeColdHrsService: PrimeColdHrsService) {}

  @Get()
  async getAll(@Query('date') date?: string): Promise<any> {
    const allRecords: PrimeColdHrs[] = await this.primeColdHrsService.findAll();

    if (date) {
      const targetDate = new Date(date);
      const start = new Date(targetDate.setUTCHours(0, 0, 0, 0));
      const end = new Date(targetDate.setUTCHours(23, 59, 59, 999));

      const filtered = allRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });

      if (filtered.length === 0) {
        return { message: 'No data found for the given date' };
      }

      return filtered;
    }

    return allRecords;
  }
}
