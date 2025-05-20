import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrimeColdHrsService } from './prime-cold-hrs.service';
import { PrimeColdHrsController } from './prime-cold-hrs.controller';
import { PrimeColdHrs, PrimeColdHrsSchema } from './schema/primeColdHrs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PrimeColdHrs.name, schema: PrimeColdHrsSchema }]),
  ],
  providers: [PrimeColdHrsService],
  controllers: [PrimeColdHrsController],
})
export class PrimeColdHrsModule {}
