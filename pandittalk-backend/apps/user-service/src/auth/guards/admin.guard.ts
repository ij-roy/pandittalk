import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../types/jwt-payload';
import { JwtAuthGuard } from './jwt-auth.guard';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated) return false;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }

    const activeAdmin = await this.prisma.user.findFirst({
      where: { id: user.sub, isActive: true, role: 'ADMIN' },
      select: { id: true, phoneNumber: true, role: true },
    });
    if (!activeAdmin) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    request.user = {
      sub: activeAdmin.id,
      phoneNumber: activeAdmin.phoneNumber,
      role: activeAdmin.role,
    };
    return true;
  }
}
