import { Controller, Get, Query } from '@nestjs/common';
import { Getroom7Dto } from './dto/get-room7.dto';
import { Room7Service } from './room7.service';

@Controller('room7')
export class Room7Controller {
  constructor(private readonly room7Service: Room7Service) {}

  @Get()
  async getgensetData(@Query() query: Getroom7Dto) {
    return this.room7Service.handleQuery(query);
  }
}
