import { Controller, Get, Query } from '@nestjs/common'; // ✅ Required import
import { GensetService } from './genset.service';
import { GetgensetDto } from './dto/get-genset.dto';

@Controller('genset')
export class GensetController {
  constructor(private readonly gensetService: GensetService) {}

  @Get()
   async getgensetData(@Query() query: GetgensetDto) {
     return this.gensetService.handleQuery(query);
   }
}
