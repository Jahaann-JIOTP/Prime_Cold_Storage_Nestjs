import { Body, Controller, Post } from '@nestjs/common';
import { EnergyUsageService } from './energy-usage.service';
import { EnergyUsageDto } from './dto/energy-usage.dto';
import { EnergyUsageResultDto } from './dto/energy-usage-result.dto';

@Controller('energy_usage')
export class EnergyUsageController {
  constructor(private readonly energyUsageService: EnergyUsageService) {}

  @Post()
  async getUsage(@Body() dto: EnergyUsageDto): Promise<EnergyUsageResultDto[]> {
    return this.energyUsageService.getEnergyUsage(dto);
  }
}
