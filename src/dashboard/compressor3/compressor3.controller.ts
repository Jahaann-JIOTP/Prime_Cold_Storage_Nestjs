



import { Controller, Get, Query } from '@nestjs/common'; // ✅ Required import
import { Compressor3Service } from './compressor3.service';
import { Getcompressor3Dto } from './dto/get-compressor3.dto';

@Controller('Compressor3')
export class Compressor3Controller{
  constructor(private readonly Compressor2Service: Compressor3Service) {}

  @Get()
   async getgensetData(@Query() query: Getcompressor3Dto) {
     return this.Compressor2Service.handleQuery(query);
   }
}
