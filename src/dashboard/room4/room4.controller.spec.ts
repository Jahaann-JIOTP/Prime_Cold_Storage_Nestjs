import { Test, TestingModule } from '@nestjs/testing';
import { Room4Controller } from './room4.controller';
import { Room4Service } from './room4.service';

describe('Room4Controller', () => {
  let controller: Room4Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Room4Controller],
      providers: [Room4Service],
    }).compile();

    controller = module.get<Room4Controller>(Room4Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
