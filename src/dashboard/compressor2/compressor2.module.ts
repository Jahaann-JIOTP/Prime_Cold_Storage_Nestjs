import { Module } from '@nestjs/common';
import { Compressor2Service } from './compressor2.service';
import { Compressor2Controller } from './compressor2.controller';

@Module({
  providers: [Compressor2Service],
  controllers: [Compressor2Controller]
})
export class Compressor2Module {}
