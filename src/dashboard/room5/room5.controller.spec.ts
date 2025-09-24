import { Test, TestingModule } from '@nestjs/testing';
import { Room5Controller } from './room5.controller';
import { Room5Service } from './room5.service';

describe('Room5Controller', () => {
  let controller: Room5Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Room5Controller],
      providers: [Room5Service],
    }).compile();

    controller = module.get<Room5Controller>(Room5Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
