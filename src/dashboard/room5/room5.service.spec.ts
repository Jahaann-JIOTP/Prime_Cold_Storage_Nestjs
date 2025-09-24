import { Test, TestingModule } from '@nestjs/testing';
import { Room5Service } from './room5.service';

describe('Room5Service', () => {
  let service: Room5Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Room5Service],
    }).compile();

    service = module.get<Room5Service>(Room5Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
