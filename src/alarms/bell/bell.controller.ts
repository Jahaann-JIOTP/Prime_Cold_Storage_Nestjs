import { Controller, Get, Post } from '@nestjs/common';
import { BellService } from './bell.service';

@Controller('bell')
export class BellController {
  constructor(private readonly bellService: BellService) {}

  @Get()
  async fetchBellData() {
    return this.bellService.fetchBellData();
  }

  @Post('acknowledge')
  async acknowledgeAll() {
    return this.bellService.acknowledgeAllRecentAlarms();
  }
}
