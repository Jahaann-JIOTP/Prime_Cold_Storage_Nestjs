import { Controller, Get, Query } from '@nestjs/common'; // ✅ Required import
import { Compressor2Service } from './compressor2.service';
import { Getcompressor2Dto } from './dto/get-compressor.dto';

@Controller('Compressor2')
export class Compressor2Controller {
  constructor(private readonly Compressor2Service: Compressor2Service) {}

  @Get()
   async getgensetData(@Query() query: Getcompressor2Dto) {
     return this.Compressor2Service.handleQuery(query);
   }
}
