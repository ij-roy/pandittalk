import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSessionService } from './auth-session.service';
import { hashRefreshToken } from './refresh-token.util';

describe('AuthSessionService', () => {
  const userId = 'user-1';
  const rawToken = 'plain-refresh-token';
  const tokenHash = hashRefreshToken(rawToken);

  function createService(prismaOverrides: Record<string, unknown> = {}) {
    const prisma = {
      authSession: {
        create: jest.fn().mockResolvedValue({
          id: 'session-new',
          userId,
          tokenHash: 'new-hash',
        }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: userId }),
      },
      ...prismaOverrides,
    };

    const config = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'REFRESH_TOKEN_TTL_DAYS') {
          return '30';
        }
        return defaultValue;
      }),
    };

    return Test.createTestingModule({
      providers: [
        AuthSessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    })
      .compile()
      .then((module) => ({
        service: module.get(AuthSessionService),
        prisma: module.get(PrismaService) as typeof prisma,
      }));
  }

  it('creates a hashed session', async () => {
    const { service, prisma } = await createService();

    const issued = await service.createSession(userId, { ip: '1.2.3.4' });

    expect(issued.refreshToken).toBeTruthy();
    expect(prisma.authSession.create).toHaveBeenCalled();
    const createArg = prisma.authSession.create.mock.calls[0][0];
    expect(createArg.data.userId).toBe(userId);
    expect(createArg.data.tokenHash).toBe(
      hashRefreshToken(issued.refreshToken),
    );
    expect(createArg.data.ip).toBe('1.2.3.4');
  });

  it('rotates a valid session and revokes the old one', async () => {
    const { service, prisma } = await createService();
    prisma.authSession.findUnique.mockResolvedValue({
      id: 'session-old',
      userId,
      tokenHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await service.rotateSession(rawToken);

    expect(result.userId).toBe(userId);
    expect(result.issued.refreshToken).toBeTruthy();
    expect(prisma.authSession.update).toHaveBeenCalledWith({
      where: { id: 'session-old' },
      data: {
        revokedAt: expect.any(Date),
        replacedById: 'session-new',
      },
    });
  });

  it('revokes all sessions on refresh-token reuse', async () => {
    const { service, prisma } = await createService();
    prisma.authSession.findUnique.mockResolvedValue({
      id: 'session-old',
      userId,
      tokenHash,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.rotateSession(rawToken)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('rejects expired refresh tokens', async () => {
    const { service, prisma } = await createService();
    prisma.authSession.findUnique.mockResolvedValue({
      id: 'session-old',
      userId,
      tokenHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.rotateSession(rawToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
