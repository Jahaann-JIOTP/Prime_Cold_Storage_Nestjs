import { Module } from '@nestjs/common';
import { SolarService} from './solar.service';
import { SolarController} from './solar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SolarSchema } from './schemas/solar.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'Solar', schema: SolarSchema, collection: 'prime_historical_data', }]),
    ],
  controllers: [SolarController],
  providers: [SolarService],
})
export class SolarModule {}
