import { Test, TestingModule } from '@nestjs/testing';
import { Room6Controller } from './room6.controller';
import { Room6Service } from './room6.service';

describe('Room6Controller', () => {
  let controller: Room6Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Room6Controller],
      providers: [Room6Service],
    }).compile();

    controller = module.get<Room6Controller>(Room6Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
