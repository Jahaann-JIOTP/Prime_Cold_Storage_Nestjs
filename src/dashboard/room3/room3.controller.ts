import { Controller, Get, Query } from '@nestjs/common';
import { Room3Service } from './room3.service';
import { Getroom3Dto } from './dto/get-room3.dto';

@Controller('room3')
export class Room3Controller {
  constructor(private readonly room3Service: Room3Service) {}

  @Get()
  async getgensetData(@Query() query: Getroom3Dto) {
    return this.room3Service.handleQuery(query);
  }
}
