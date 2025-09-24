import { Test, TestingModule } from '@nestjs/testing';
import { Room4Service } from './room4.service';

describe('Room4Service', () => {
  let service: Room4Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Room4Service],
    }).compile();

    service = module.get<Room4Service>(Room4Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
