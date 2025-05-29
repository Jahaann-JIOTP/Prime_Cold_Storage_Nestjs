import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompressorRuntime, CompressorRuntimeSchema } from './schema/compressor-runtime.schema';
import { CompressorRuntimeService } from './compressor-runtime.service';
import { CompressorRuntimeController } from './compressor-runtime.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CompressorRuntime.name, schema: CompressorRuntimeSchema }]),
  ],
  controllers: [CompressorRuntimeController],
  providers: [CompressorRuntimeService],
})
export class CompressorRuntimeModule {}
