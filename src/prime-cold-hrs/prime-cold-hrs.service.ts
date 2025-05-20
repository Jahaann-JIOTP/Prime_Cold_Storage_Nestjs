import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrimeColdHrs, PrimeColdHrsDocument } from './schema/primeColdHrs.schema';

@Injectable()
export class PrimeColdHrsService {
  constructor(
    @InjectModel(PrimeColdHrs.name) private primeColdHrsModel: Model<PrimeColdHrsDocument>,
  ) {}

  // Get all records (or add filters later)
  async findAll(): Promise<PrimeColdHrs[]> {
    return this.primeColdHrsModel.find().exec();
  }
}
