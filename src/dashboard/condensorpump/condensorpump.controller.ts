import { Controller, Get, Query } from '@nestjs/common'; // ✅ Required import
import { Compressor4Service } from './condensorpump.service';
import { Getcompressor2Dto } from './dto/get-compressor.dto';

@Controller('Condensorpump')
export class Compressor4Controller {
  constructor(private readonly Compressor4Service: Compressor4Service) {}

  @Get()
   async getgensetData(@Query() query: Getcompressor2Dto) {
     return this.Compressor4Service.handleQuery(query);
   }
}
