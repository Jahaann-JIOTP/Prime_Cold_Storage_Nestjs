import { Test, TestingModule } from '@nestjs/testing';
import { Room1Service } from './room1.service';

describe('Room1Service', () => {
  let service: Room1Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Room1Service],
    }).compile();

    service = module.get<Room1Service>(Room1Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
