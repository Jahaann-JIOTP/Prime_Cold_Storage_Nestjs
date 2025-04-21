import { Module } from '@nestjs/common';
import { transformerController } from './transformer.controller';
import { TransformerService } from './transformer.service';

@Module({
  controllers: [transformerController],
  providers: [TransformerService],
})
export class TransformerModule {}
