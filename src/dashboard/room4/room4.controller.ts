import { Controller, Get, Query } from '@nestjs/common';
import { Room4Service } from './room4.service';
import { Getroom4Dto } from './dto/get-room4.dto';

@Controller('room4')
export class Room4Controller {
  constructor(private readonly room4Service: Room4Service) {}

  @Get()
  async getgensetData(@Query() query: Getroom4Dto) {
    return this.room4Service.handleQuery(query);
  }
}
