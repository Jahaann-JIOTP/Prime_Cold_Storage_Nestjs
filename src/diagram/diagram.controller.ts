import { Controller, Get, Param } from '@nestjs/common';
import { DiagramService } from './diagram.service';

@Controller('diagram')
export class DiagramController {
  constructor(private readonly diagramService: DiagramService) {}

  @Get('meter-data/:type/:meter')
  getData(
    @Param('type') type: 'power' | 'energy' | 'volts',
    @Param('meter') meter: string,
  ) {
    return this.diagramService.fetchMeterData(type, meter);
  }
}
