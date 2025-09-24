import { Controller, Get, Query } from '@nestjs/common';
import { Getroom5Dto } from './dto/get-room5.dto';
import { Room5Service } from './room5.service';

@Controller('room5')
export class Room5Controller {
  constructor(private readonly room5Service: Room5Service) {}

  @Get()
  async getgensetData(@Query() query: Getroom5Dto) {
    return this.room5Service.handleQuery(query);
  }
}
