import { Test, TestingModule } from '@nestjs/testing';
import { Room7Controller } from './room7.controller';
import { Room7Service } from './room7.service';

describe('Room7Controller', () => {
  let controller: Room7Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Room7Controller],
      providers: [Room7Service],
    }).compile();

    controller = module.get<Room7Controller>(Room7Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
