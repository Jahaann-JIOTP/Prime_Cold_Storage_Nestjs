import { Test, TestingModule } from '@nestjs/testing';
import { Room3Controller } from './room3.controller';
import { Room3Service } from './room3.service';

describe('Room3Controller', () => {
  let controller: Room3Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Room3Controller],
      providers: [Room3Service],
    }).compile();

    controller = module.get<Room3Controller>(Room3Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
