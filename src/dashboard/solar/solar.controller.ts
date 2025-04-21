// src/solar/solar.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { SolarService } from './solar.service';
import { GetSolarDto } from './dto/get-solar.dto';
import { Validate } from 'class-validator';

@Controller('solar')
export class SolarController {
  constructor(private readonly solarService: SolarService) {}

  @Get()
  async getSolarData(@Query() query: GetSolarDto) {
    return this.solarService.handleQuery(query);
  }
}
