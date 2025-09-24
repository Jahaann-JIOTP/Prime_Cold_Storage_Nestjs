import { Controller, Get, Query } from '@nestjs/common';
import { Room2Service } from './room2.service';
import { Getroom2Dto } from './dto/get-room2.dto';

@Controller('room2')
export class Room2Controller {
  constructor(private readonly room2Service: Room2Service) {}

  @Get()
  async getgensetData(@Query() query: Getroom2Dto) {
    return this.room2Service.handleQuery(query);
  }
}
