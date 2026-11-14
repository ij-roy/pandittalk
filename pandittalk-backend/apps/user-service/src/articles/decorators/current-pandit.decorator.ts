import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Pandit } from '@prisma/client';
import type { Request } from 'express';

export const CurrentPandit = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Pandit => {
    const req = ctx.switchToHttp().getRequest<Request & { pandit?: Pandit }>();
    const pandit = req.pandit;
    if (!pandit) {
      throw new Error('CurrentPandit used without PanditGuard');
    }
    return pandit;
  },
);
