import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from '@pandittalk/common';

@Injectable()
export class PanditServiceService {
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'pandit-service',
      timestamp: new Date().toISOString(),
    };
  }
}
