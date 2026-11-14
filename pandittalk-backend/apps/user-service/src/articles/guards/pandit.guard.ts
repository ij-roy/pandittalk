import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Pandit } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';

type AuthedRequest = Request & {
  user?: AuthenticatedUser;
  pandit?: Pandit;
};

@Injectable()
export class PanditGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const userId = req.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const pandit = await this.prisma.pandit.findUnique({
      where: { userId },
    });
    if (!pandit) {
      throw new ForbiddenException(
        'No pandit profile linked to this account',
      );
    }

    req.pandit = pandit;
    return true;
  }
}
