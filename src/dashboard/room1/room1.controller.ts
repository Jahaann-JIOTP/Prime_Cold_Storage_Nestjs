import { Controller, Get, Query } from '@nestjs/common';
import { Getroom1Dto } from './dto/get-room1.dto';
import { Room1Service } from './room1.service';

@Controller('room1')
export class Room1Controller {
  constructor(private readonly room1Service: Room1Service) {}

  @Get()
  async getgensetData(@Query() query: Getroom1Dto) {
    return this.room1Service.handleQuery(query);
  }
}
