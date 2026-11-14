import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthSession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateRefreshToken,
  hashRefreshToken,
} from './refresh-token.util';

export type SessionMeta = {
  ip?: string;
  userAgent?: string;
};

export type IssuedRefresh = {
  refreshToken: string;
  session: AuthSession;
  maxAgeSeconds: number;
};

@Injectable()
export class AuthSessionService {
  private readonly ttlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const raw = config.get<string>('REFRESH_TOKEN_TTL_DAYS', '30');
    const parsed = Number.parseInt(raw, 10);
    this.ttlDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
  }

  getRefreshMaxAgeSeconds(): number {
    return this.ttlDays * 24 * 60 * 60;
  }

  async createSession(
    userId: string,
    meta: SessionMeta = {},
  ): Promise<IssuedRefresh> {
    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.getRefreshMaxAgeSeconds() * 1000,
    );

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    return {
      refreshToken,
      session,
      maxAgeSeconds: this.getRefreshMaxAgeSeconds(),
    };
  }

  async rotateSession(
    rawRefreshToken: string,
    meta: SessionMeta = {},
  ): Promise<{ userId: string; issued: IssuedRefresh }> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existing = await this.prisma.authSession.findUnique({
      where: { tokenHash },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt) {
      // Reuse of a rotated token — revoke the whole user session family.
      await this.revokeAllSessions(existing.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: existing.userId, isActive: true },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const issued = await this.createSession(existing.userId, meta);

    await this.prisma.authSession.update({
      where: { id: existing.id },
      data: {
        revokedAt: new Date(),
        replacedById: issued.session.id,
      },
    });

    return { userId: existing.userId, issued };
  }

  async revokeSession(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existing = await this.prisma.authSession.findUnique({
      where: { tokenHash },
    });
    if (!existing || existing.revokedAt) {
      return;
    }
    await this.prisma.authSession.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }
}
