import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

function contextWithRole(role: 'CUSTOMER' | 'PANDIT' | 'ADMIN') {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { sub: 'user-1', phoneNumber: '+910000000000', role },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('rejects a valid non-admin user for an Admin-only route', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(contextWithRole('PANDIT'))).toThrow(
      ForbiddenException,
    );
  });

  it('allows an Admin for an Admin-only route', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextWithRole('ADMIN'))).toBe(true);
  });
});

describe('AdminGuard', () => {
  afterEach(() => jest.restoreAllMocks());

  it('rejects a non-admin after JWT authentication succeeds', async () => {
    jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockResolvedValue(true as never);
    const guard = new AdminGuard({} as PrismaService);
    const context = contextWithRole('PANDIT');

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('reloads and accepts an active Admin from Prisma', async () => {
    jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockResolvedValue(true as never);
    const request = {
      user: { sub: 'admin-1', phoneNumber: '+919999999996', role: 'ADMIN' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'admin-1',
          phoneNumber: '+919999999996',
          role: 'ADMIN',
        }),
      },
    } as unknown as PrismaService;
    const guard = new AdminGuard(prisma);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'admin-1', isActive: true, role: 'ADMIN' },
      select: { id: true, phoneNumber: true, role: true },
    });
  });
});
