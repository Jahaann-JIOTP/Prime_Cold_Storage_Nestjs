// src/solar/solar.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import {TransformerService } from './transformer.service';
import { GettransformerDto } from './dto/get-transformer.dto';
import { Validate } from 'class-validator';

@Controller('transformer')
export class transformerController {
  constructor(private readonly transformerService: TransformerService) {}

  @Get()
  async gettransformerData(@Query() query: GettransformerDto) {
    return this.transformerService.handleQuery(query);
  }
}
