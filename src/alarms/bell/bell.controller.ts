import { Controller, Get, Post } from '@nestjs/common';
import { BellService } from './bell.service';

@Controller('bell')
export class BellController {
  constructor(private readonly bellService: BellService) {}

  @Get()
  async getAllBells() {
    return this.bellService.getAllBells();
  }

  @Post('acknowledge')
  async acknowledgeAll() {
    return this.bellService.acknowledgeAllBells();
  }
}
