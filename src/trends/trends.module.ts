// src/trends/trends.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrendsController } from './trends.controller';
import { TrendsService } from './trends.service';
import { CSNew, CSNewSchema } from './schemas/CS-new.schema';
import { CSActiveTags, CSActiveTagsSchema } from './schemas/CS-activetags.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CSNew.name, schema: CSNewSchema, collection: 'prime_historical_data' },
      // { name: CSActiveTags.name, schema: CSActiveTagsSchema, collection: 'GCL_ActiveTags' },
    ]),
  ],
  controllers: [TrendsController],
  providers: [TrendsService],
})
export class TrendsModule {}
