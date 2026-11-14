import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AppleTokenVerifier } from './apple-token.verifier';
import { GoogleTokenVerifier } from './google-token.verifier';
import { OtpRateLimitService } from './otp-rate-limit.service';
import { OtpStoreService } from './otp-store.service';
import { OtpSmsService } from './sms/otp-sms.service';
import { SocialPendingStore } from './social-pending.store';

const phoneNumber = '+919999999999';

const mockUser = {
  id: 'user-1',
  phoneNumber,
  name: null,
  walletBalance: { toString: () => '0' },
  coinBalance: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  profileCompleted: false,
  isActive: true,
};

function createModule(allowTestOtp: string, testOtpAllowlist = '') {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      findFirst: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue(mockUser),
    },
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };
  const otpStore = {
    verifyAndConsume: jest.fn(),
    save: jest.fn(),
  };
  const otpRateLimit = {
    reserveSend: jest.fn(),
    releaseReservation: jest.fn(),
    assertVerifyAllowed: jest.fn(),
  };
  const otpSms = {
    sendOtp: jest.fn(),
  };
  const authSessions = {
    createSession: jest.fn().mockResolvedValue({
      refreshToken: 'refresh-token-1',
      session: { id: 'session-1' },
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
    rotateSession: jest.fn().mockResolvedValue({
      userId: mockUser.id,
      issued: {
        refreshToken: 'refresh-token-2',
        session: { id: 'session-2' },
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
    }),
    revokeSession: jest.fn().mockResolvedValue(undefined),
    revokeAllSessions: jest.fn().mockResolvedValue(2),
  };
  const config = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'ALLOW_TEST_OTP') {
        return allowTestOtp;
      }
      if (key === 'TEST_OTP_PHONE_ALLOWLIST') {
        return testOtpAllowlist;
      }
      return defaultValue;
    }),
  };

  return Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prisma },
      { provide: JwtService, useValue: jwtService },
      { provide: OtpStoreService, useValue: otpStore },
      { provide: OtpRateLimitService, useValue: otpRateLimit },
      { provide: OtpSmsService, useValue: otpSms },
      { provide: AuthSessionService, useValue: authSessions },
      { provide: GoogleTokenVerifier, useValue: { verify: jest.fn() } },
      { provide: AppleTokenVerifier, useValue: { verify: jest.fn() } },
      { provide: SocialPendingStore, useValue: { save: jest.fn(), consume: jest.fn() } },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();
}

describe('AuthService.verifyOtp', () => {
  it('rejects test OTP 1234 when ALLOW_TEST_OTP is false', async () => {
    const module = await createModule('false');
    const authService = module.get(AuthService);
    const otpStore = module.get(OtpStoreService);

    otpStore.verifyAndConsume.mockResolvedValue(false);

    await expect(
      authService.verifyOtp({
        phoneNumber,
        otp: '1234',
        acceptedLegalConsent: true,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(otpStore.verifyAndConsume).toHaveBeenCalledWith(phoneNumber, '1234');
  });

  it('rejects verify when legal consent is missing', async () => {
    const module = await createModule('true');
    const authService = module.get(AuthService);

    await expect(
      authService.verifyOtp({
        phoneNumber,
        otp: '1234',
        acceptedLegalConsent: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts test OTP 1234 when ALLOW_TEST_OTP is true without Redis', async () => {
    const module = await createModule('true');
    const authService = module.get(AuthService);
    const otpStore = module.get(OtpStoreService);
    const authSessions = module.get(AuthSessionService);
    const prisma = module.get(PrismaService);

    const result = await authService.verifyOtp({
      phoneNumber,
      otp: '1234',
      acceptedLegalConsent: true,
    });

    expect(otpStore.verifyAndConsume).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toBe('refresh-token-1');
    expect(authSessions.createSession).toHaveBeenCalledWith(mockUser.id, {});
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          acceptedAge18: true,
          termsVersion: '2.0',
          privacyVersion: '2.0',
        }),
      }),
    );
  });

  it('accepts a valid Redis OTP when ALLOW_TEST_OTP is false', async () => {
    const module = await createModule('false');
    const authService = module.get(AuthService);
    const otpStore = module.get(OtpStoreService);

    otpStore.verifyAndConsume.mockResolvedValue(true);

    const result = await authService.verifyOtp({
      phoneNumber,
      otp: '5678',
      acceptedLegalConsent: true,
    });

    expect(otpStore.verifyAndConsume).toHaveBeenCalledWith(phoneNumber, '5678');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toBe('refresh-token-1');
  });

  it('accepts test OTP 1234 for an allowlisted number when ALLOW_TEST_OTP is false', async () => {
    const allowlistedPhone = '+919999999998';
    const module = await createModule('false', allowlistedPhone);
    const authService = module.get(AuthService);
    const otpStore = module.get(OtpStoreService);

    const result = await authService.verifyOtp({
      phoneNumber: allowlistedPhone,
      otp: '1234',
      acceptedLegalConsent: true,
    });

    expect(otpStore.verifyAndConsume).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('jwt-token');
  });

  it('rejects test OTP 1234 for a non-allowlisted number when ALLOW_TEST_OTP is false', async () => {
    const module = await createModule('false', '+919999999998');
    const authService = module.get(AuthService);
    const otpStore = module.get(OtpStoreService);

    otpStore.verifyAndConsume.mockResolvedValue(false);

    await expect(
      authService.verifyOtp({
        phoneNumber,
        otp: '1234',
        acceptedLegalConsent: true,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(otpStore.verifyAndConsume).toHaveBeenCalledWith(phoneNumber, '1234');
  });
});

describe('AuthService.requestOtp', () => {
  it('skips the real SMS send for an allowlisted number when ALLOW_TEST_OTP is false', async () => {
    const allowlistedPhone = '+919999999998';
    const module = await createModule('false', allowlistedPhone);
    const authService = module.get(AuthService);
    const otpSms = module.get(OtpSmsService);
    const otpStore = module.get(OtpStoreService);
    const otpRateLimit = module.get(OtpRateLimitService);

    await authService.requestOtp(allowlistedPhone, '127.0.0.1');

    expect(otpRateLimit.reserveSend).toHaveBeenCalledWith(
      allowlistedPhone,
      '127.0.0.1',
    );
    expect(otpStore.save).toHaveBeenCalled();
    expect(otpSms.sendOtp).not.toHaveBeenCalled();
    expect(otpRateLimit.releaseReservation).not.toHaveBeenCalled();
  });

  it('releases reservation when SMS send fails', async () => {
    const module = await createModule('false', '+919999999998');
    const authService = module.get(AuthService);
    const otpSms = module.get(OtpSmsService);
    const otpRateLimit = module.get(OtpRateLimitService);

    otpSms.sendOtp.mockRejectedValue(new Error('MSG91 down'));

    await expect(
      authService.requestOtp(phoneNumber, '127.0.0.1'),
    ).rejects.toThrow('MSG91 down');

    expect(otpRateLimit.releaseReservation).toHaveBeenCalledWith(
      phoneNumber,
      '127.0.0.1',
    );
  });

  it('sends the real SMS for a non-allowlisted number when ALLOW_TEST_OTP is false', async () => {
    const module = await createModule('false', '+919999999998');
    const authService = module.get(AuthService);
    const otpSms = module.get(OtpSmsService);

    await authService.requestOtp(phoneNumber, '127.0.0.1');

    expect(otpSms.sendOtp).toHaveBeenCalled();
  });

  it('skips SMS for an allowlisted number even when ALLOW_TEST_OTP is true', async () => {
    const allowlistedPhone = '+919999999998';
    const module = await createModule('true', allowlistedPhone);
    const authService = module.get(AuthService);
    const otpSms = module.get(OtpSmsService);

    await authService.requestOtp(allowlistedPhone, '127.0.0.1');

    expect(otpSms.sendOtp).not.toHaveBeenCalled();
  });
});

describe('AuthService.refresh', () => {
  it('rotates refresh and returns a new access token', async () => {
    const module = await createModule('true');
    const authService = module.get(AuthService);
    const authSessions = module.get(AuthSessionService);

    const result = await authService.refresh('old-refresh', {
      ip: '127.0.0.1',
    });

    expect(authSessions.rotateSession).toHaveBeenCalledWith('old-refresh', {
      ip: '127.0.0.1',
    });
    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toBe('refresh-token-2');
  });

  it('rejects missing refresh token', async () => {
    const module = await createModule('true');
    const authService = module.get(AuthService);

    await expect(authService.refresh(undefined)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('AuthService.logout', () => {
  it('revokes the current refresh session when present', async () => {
    const module = await createModule('true');
    const authService = module.get(AuthService);
    const authSessions = module.get(AuthSessionService);

    await authService.logout('refresh-token-1');

    expect(authSessions.revokeSession).toHaveBeenCalledWith('refresh-token-1');
  });

  it('no-ops when refresh token is missing', async () => {
    const module = await createModule('true');
    const authService = module.get(AuthService);
    const authSessions = module.get(AuthSessionService);

    await authService.logout(undefined);

    expect(authSessions.revokeSession).not.toHaveBeenCalled();
  });
});
