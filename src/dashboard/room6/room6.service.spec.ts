import { Test, TestingModule } from '@nestjs/testing';
import { Room6Service } from './room6.service';

describe('Room6Service', () => {
  let service: Room6Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Room6Service],
    }).compile();

    service = module.get<Room6Service>(Room6Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
