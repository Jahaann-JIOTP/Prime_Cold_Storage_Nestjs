import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class NodeRedLinkService {
  constructor(private readonly httpService: HttpService) {}

  // node-red link
  async fetchNodeRedData(): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(
        'http://43.204.118.114:6881/prime_cold',
      );
      return response.data;
    } catch (error) {
      throw new HttpException('Unable to fetch data from Node-RED', 500);
    }
  }
}
