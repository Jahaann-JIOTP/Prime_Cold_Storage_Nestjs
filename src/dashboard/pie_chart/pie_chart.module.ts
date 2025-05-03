// src/pie-chart/pie-chart.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PieChartController } from './pie_chart.controller';
import { PieChartService } from './pie_chart.service';
import { PieChartSchema } from './schemas/pie-chart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'PieChart', schema: PieChartSchema }]),
  ],
  controllers: [PieChartController],
  providers: [PieChartService],
})
export class PieChartModule {}
