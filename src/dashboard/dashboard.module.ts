// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ActiveTagsSchema } from './schemas/dashboard.schema'; // Corrected the import
import { Room1Module } from './room1/room1.module';
import { Room2Module } from './room2/room2.module';
import { Room3Module } from './room3/room3.module';
import { Room4Module } from './room4/room4.module';
import { Room5Module } from './room5/room5.module';
import { Room6Module } from './room6/room6.module';
import { Room7Module } from './room7/room7.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'prime_historical_data', schema: ActiveTagsSchema }]),
    Room1Module,
    Room2Module,
    Room3Module,
    Room4Module,
    Room5Module,
    Room6Module,
    Room7Module, // Use ActiveTagsSchema here
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
