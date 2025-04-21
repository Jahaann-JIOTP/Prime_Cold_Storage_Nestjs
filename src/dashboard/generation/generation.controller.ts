import { Controller, Get, Query } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GenerationDto } from './dto/generation.dto'; // Correct import for DTO

@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Get()
  async getGeneration(@Query() query: GenerationDto) {
    // Call handleQuery method from the service
    return this.generationService.handleQuery(query);
  }
}
