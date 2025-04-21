import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { Generation, GenerationSchema } from './schemas/generation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Generation.name, schema: GenerationSchema }])
  ],
  controllers: [GenerationController],
  providers: [GenerationService]
})
export class GenerationModule {}