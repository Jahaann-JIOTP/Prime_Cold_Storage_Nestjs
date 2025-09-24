import { Test, TestingModule } from '@nestjs/testing';
import { Room7Service } from './room7.service';

describe('Room7Service', () => {
  let service: Room7Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Room7Service],
    }).compile();

    service = module.get<Room7Service>(Room7Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
