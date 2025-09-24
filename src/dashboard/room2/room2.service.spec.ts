import { Test, TestingModule } from '@nestjs/testing';
import { Room2Service } from './room2.service';

describe('Room2Service', () => {
  let service: Room2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Room2Service],
    }).compile();

    service = module.get<Room2Service>(Room2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
