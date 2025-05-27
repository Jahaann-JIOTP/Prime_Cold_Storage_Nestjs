import { Module } from '@nestjs/common';
import { TransformerService } from './transformer.service';
import { transformerController} from './transformer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { transformerSchema } from './schemas/transformer.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'transformer', schema: transformerSchema, collection: 'prime_historical_data', }]),
    ],
  controllers: [transformerController],
  providers: [TransformerService],
})
export class TransformerModule {}
