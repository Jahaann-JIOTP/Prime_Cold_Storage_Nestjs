import { Test, TestingModule } from '@nestjs/testing';
import { Room3Service } from './room3.service';

describe('Room3Service', () => {
  let service: Room3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Room3Service],
    }).compile();

    service = module.get<Room3Service>(Room3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
