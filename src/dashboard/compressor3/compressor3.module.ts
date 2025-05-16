import { Module } from '@nestjs/common';
import { Compressor3Service } from './compressor3.service';
import { Compressor3Controller } from './compressor3.controller';

@Module({
  providers: [Compressor3Service],
  controllers: [Compressor3Controller]
})
export class Compressor3Module {}
