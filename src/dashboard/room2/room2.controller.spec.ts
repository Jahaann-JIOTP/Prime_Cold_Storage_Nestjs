import { Test, TestingModule } from '@nestjs/testing';
import { Room2Controller } from './room2.controller';
import { Room2Service } from './room2.service';

describe('Room2Controller', () => {
  let controller: Room2Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Room2Controller],
      providers: [Room2Service],
    }).compile();

    controller = module.get<Room2Controller>(Room2Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
