
import { Controller, Get, Query } from '@nestjs/common'; // ✅ Required import
import { Compressor1Service } from './compressor1.service';
import { Getcompressor1Dto } from './dto/get-compressor1.dto';

@Controller('Compressor1')
export class Compressor1Controller {
  constructor(private readonly Compressor1Service: Compressor1Service) {}

  @Get()
   async getgensetData(@Query() query: Getcompressor1Dto) {
     return this.Compressor1Service.handleQuery(query);
   }
}
