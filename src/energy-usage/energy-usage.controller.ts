import { Body, Controller, Post } from '@nestjs/common';
import { EnergyUsageService } from './energy-usage.service';
import { EnergyUsageDto } from './dto/energy-usage.dto';
import { EnergyUsageResult } from './energy-usage.service'; // Import the EnergyUsageResult type

@Controller('energy_usage')
export class EnergyUsageController {
  constructor(private readonly energyUsageService: EnergyUsageService) {}

  @Post()
  async getUsage(@Body() dto: EnergyUsageDto): Promise<EnergyUsageResult[]> {
    return this.energyUsageService.getEnergyUsage(dto);
  }
}
