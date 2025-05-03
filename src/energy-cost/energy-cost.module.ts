// src/energy-cost/energy-cost.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnergyCostController } from './energy-cost.controller';
import { EnergyCostService } from './energy-cost.service';
import { EnergyCost, EnergyCostSchema } from './schemas/energy-cost.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EnergyCost.name, schema: EnergyCostSchema },
    ]),
  ],
  controllers: [EnergyCostController],
  providers: [EnergyCostService],
})
export class EnergyCostModule {}
