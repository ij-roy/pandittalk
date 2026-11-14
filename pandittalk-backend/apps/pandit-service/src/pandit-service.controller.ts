import { Controller, Get } from '@nestjs/common';
import { HealthResponseDto } from '@pandittalk/common';
import { PanditServiceService } from './pandit-service.service';

@Controller()
export class PanditServiceController {
  constructor(private readonly panditServiceService: PanditServiceService) {}

  @Get()
  getHealth(): HealthResponseDto {
    return this.panditServiceService.getHealth();
  }
}
