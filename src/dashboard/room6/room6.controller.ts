import { Controller, Get, Query } from '@nestjs/common';
import { Getroom6Dto } from './dto/get-room6.dto';
import { Room6Service } from './room6.service';

@Controller('room6')
export class Room6Controller {
  constructor(private readonly room6Service: Room6Service) {}

  @Get()
  async getgensetData(@Query() query: Getroom6Dto) {
    return this.room6Service.handleQuery(query);
  }
}
