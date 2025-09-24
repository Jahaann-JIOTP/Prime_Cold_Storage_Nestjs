import { Test, TestingModule } from '@nestjs/testing';
import { Room1Controller } from './room1.controller';
import { Room1Service } from './room1.service';

describe('Room1Controller', () => {
  let controller: Room1Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Room1Controller],
      providers: [Room1Service],
    }).compile();

    controller = module.get<Room1Controller>(Room1Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
