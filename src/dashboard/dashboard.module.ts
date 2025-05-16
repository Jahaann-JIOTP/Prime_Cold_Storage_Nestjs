// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ActiveTagsSchema } from './schemas/dashboard.schema'; // Corrected the import

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'prime_historical_data', schema: ActiveTagsSchema }]), // Use ActiveTagsSchema here
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
