// bell/bell.controller.ts
import { Controller, Get } from '@nestjs/common';
import { BellService } from './bell.service';

@Controller('bell')
export class BellController {
  constructor(private readonly bellService: BellService) {}

  @Get()
  async getBellData() {
    return this.bellService.fetchBellData();
  }
  
}
