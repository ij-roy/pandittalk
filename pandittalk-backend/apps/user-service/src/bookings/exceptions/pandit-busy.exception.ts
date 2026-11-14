import { ConflictException } from '@nestjs/common';

export interface PanditBusyResponse {
  code: 'PANDIT_BUSY';
  message: string;
  estimatedAvailableAt: string | null;
  queueLength: number;
  canJoinQueue: boolean;
}

export class PanditBusyException extends ConflictException {
  constructor(body: PanditBusyResponse) {
    super(body);
  }
}
