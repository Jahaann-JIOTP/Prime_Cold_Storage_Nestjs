import { Controller, Get, Query } from '@nestjs/common'; // ✅ Required import
import { Compressor5Service } from './condensormotor.service';
import { Getcompressor2Dto } from './dto/get-compressor.dto';

@Controller('Condensormotor')
export class Compressor5Controller {
  constructor(private readonly Compressor2Service: Compressor5Service) {}

  @Get()
   async getgensetData(@Query() query: Getcompressor2Dto) {
     return this.Compressor2Service.handleQuery(query);
   }
}
