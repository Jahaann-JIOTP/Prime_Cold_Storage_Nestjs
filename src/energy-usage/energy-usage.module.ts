import { Module } from '@nestjs/common';
import { EnergyUsageService } from './energy-usage.service';
import { EnergyUsageController } from './energy-usage.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EnergyUsage, EnergyUsageSchema } from './schemas/energy-usage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EnergyUsage.name, schema: EnergyUsageSchema }]),
  ],
  controllers: [EnergyUsageController],
  providers: [EnergyUsageService],
})
export class EnergyUsageModule {}
