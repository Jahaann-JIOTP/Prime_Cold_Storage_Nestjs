import { Module } from '@nestjs/common';
import { Compressor1Service } from './compressor1.service';
import { Compressor1Controller } from './compressor1.controller';

@Module({
  providers: [Compressor1Service],
  controllers: [Compressor1Controller]
})
export class Compressor1Module {}
