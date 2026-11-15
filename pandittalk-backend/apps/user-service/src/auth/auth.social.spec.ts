import { Test } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { OtpRateLimitService } from './otp-rate-limit.service';
import { OtpStoreService } from './otp-store.service';
import { OtpSmsService } from './sms/otp-sms.service';
import { AppleTokenVerifier } from './apple-token.verifier';
import { GoogleTokenVerifier } from './google-token.verifier';
import { SocialPendingStore } from './social-pending.store';

const phoneNumber = '+919888888888';

const googleIdentity = {
  provider: 'google' as const,
  subject: 'google-sub-1',
  email: 'priya@gmail.com',
  firstName: 'Priya',
  lastName: 'Shah',
  pictureUrl: 'https://lh3.googleusercontent.com/a/priya',
};

const mockUser = {
  id: 'user-1',
  phoneNumber,
  name: 'Priya Shah',
  firstName: 'Priya',
  lastName: 'Shah',
  email: 'priya@gmail.com',
  googleSub: 'google-sub-1',
  appleSub: null,
  profileImageUrl: googleIdentity.pictureUrl,
  walletBalance: { toString: () => '0' },
  coinBalance: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  profileCompleted: false,
  isActive: true,
};

async function createModule() {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
  };
  const googleVerifier = {
    verify: jest.fn().mockResolvedValue(googleIdentity),
  };
  const appleVerifier = {
    verify: jest.fn(),
  };
  const pendingStore = {
    save: jest.fn().mockResolvedValue('pending-token-1'),
    consume: jest.fn(),
  };
  const otpStore = {
    verifyAndConsume: jest.fn().mockResolvedValue(true),
    save: jest.fn(),
  };
  const otpRateLimit = {
    reserveSend: jest.fn(),
    releaseReservation: jest.fn(),
    assertVerifyAllowed: jest.fn(),
  };
  const authSessions = {
    createSession: jest.fn().mockResolvedValue({
      refreshToken: 'refresh-token-1',
      session: { id: 'session-1' },
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
    rotateSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
  };

  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prisma },
      {
        provide: JwtService,
        useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') },
      },
      { provide: OtpStoreService, useValue: otpStore },
      { provide: OtpRateLimitService, useValue: otpRateLimit },
      { provide: OtpSmsService, useValue: { sendOtp: jest.fn() } },
      { provide: AuthSessionService, useValue: authSessions },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn(
            (_key: string, defaultValue?: string) => defaultValue ?? 'false',
          ),
        },
      },
      { provide: GoogleTokenVerifier, useValue: googleVerifier },
      { provide: AppleTokenVerifier, useValue: appleVerifier },
      { provide: SocialPendingStore, useValue: pendingStore },
    ],
  }).compile();

  return {
    authService: module.get(AuthService),
    prisma,
    googleVerifier,
    pendingStore,
    otpStore,
    otpRateLimit,
    authSessions,
  };
}

describe('AuthService.signInWithGoogle', () => {
  it('rejects when legal consent is missing', async () => {
    const { authService } = await createModule();
    await expect(
      authService.signInWithGoogle({
        idToken: 'google-id-token',
        acceptedLegalConsent: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns needsPhone for a new Google identity', async () => {
    const { authService, pendingStore } = await createModule();

    const result = await authService.signInWithGoogle({
      idToken: 'google-id-token',
      acceptedLegalConsent: true,
    });

    expect(result).toEqual({
      needsPhone: true,
      pendingToken: 'pending-token-1',
    });
    expect(pendingStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        subject: 'google-sub-1',
        email: 'priya@gmail.com',
      }),
    );
  });

  it('issues tokens when Google subject already has an account', async () => {
    const ctx = await createModule();
    ctx.prisma.user.findFirst.mockResolvedValue(mockUser);

    const result = await ctx.authService.signInWithGoogle({
      idToken: 'google-id-token',
      acceptedLegalConsent: true,
    });

    expect(result).toMatchObject({
      accessToken: 'jwt-token',
      refreshToken: 'refresh-token-1',
      isNewUser: false,
    });
    expect(ctx.pendingStore.save).not.toHaveBeenCalled();
  });
});

describe('AuthService.completeSocialAuth', () => {
  const pending = {
    provider: 'google' as const,
    subject: 'google-sub-1',
    email: 'priya@gmail.com',
    firstName: 'Priya',
    lastName: 'Shah',
    pictureUrl: googleIdentity.pictureUrl,
    acceptedLegalConsent: true,
  };

  it('creates a new user with phone plus Google profile fields', async () => {
    const ctx = await createModule();
    ctx.pendingStore.consume.mockResolvedValue(pending);

    const result = await ctx.authService.completeSocialAuth({
      pendingToken: 'pending-token-1',
      phoneNumber,
      otp: '1234',
    });

    expect(ctx.otpStore.verifyAndConsume).toHaveBeenCalledWith(
      phoneNumber,
      '1234',
    );
    expect(ctx.prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phoneNumber,
          email: 'priya@gmail.com',
          firstName: 'Priya',
          googleSub: 'google-sub-1',
        }),
      }),
    );
    expect(result).toMatchObject({
      accessToken: 'jwt-token',
      isNewUser: true,
      hasProfile: false,
    });
  });

  it('links Google onto an existing phone account with no Google or email', async () => {
    const ctx = await createModule();
    ctx.pendingStore.consume.mockResolvedValue(pending);
    ctx.prisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      email: null,
      googleSub: null,
      name: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
    });
    ctx.prisma.user.update.mockResolvedValue(mockUser);

    const result = await ctx.authService.completeSocialAuth({
      pendingToken: 'pending-token-1',
      phoneNumber,
      otp: '1234',
    });

    expect(ctx.prisma.user.create).not.toHaveBeenCalled();
    expect(ctx.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          googleSub: 'google-sub-1',
          email: 'priya@gmail.com',
        }),
      }),
    );
    expect(result.isNewUser).toBe(false);
  });

  it('rejects when the phone already belongs to a different Google account', async () => {
    const ctx = await createModule();
    ctx.pendingStore.consume.mockResolvedValue(pending);
    ctx.prisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      googleSub: 'someone-else',
      email: 'other@gmail.com',
    });

    await expect(
      ctx.authService.completeSocialAuth({
        pendingToken: 'pending-token-1',
        phoneNumber,
        otp: '1234',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a missing pending token', async () => {
    const ctx = await createModule();
    ctx.pendingStore.consume.mockResolvedValue(null);

    await expect(
      ctx.authService.completeSocialAuth({
        pendingToken: 'expired',
        phoneNumber,
        otp: '1234',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
