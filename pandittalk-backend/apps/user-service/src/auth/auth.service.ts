import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSessionService, type SessionMeta } from './auth-session.service';
import { AppleTokenVerifier } from './apple-token.verifier';
import { GoogleTokenVerifier } from './google-token.verifier';
import { OtpRateLimitService } from './otp-rate-limit.service';
import { OtpStoreService } from './otp-store.service';
import { OtpSmsService } from './sms/otp-sms.service';
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from './legal-consent.constants';
import type { SocialIdentity, SocialPendingRecord } from './social-identity';
import { SocialPendingStore } from './social-pending.store';
import { JwtPayload } from './types/jwt-payload';
import type { UserRole } from './types/user-role';

/** Fixed OTP for automated tests / quick local checks without request-otp. */
const TEST_OTP = '1234';

export type VerifyOtpInput = {
  phoneNumber: string;
  otp: string;
  acceptedLegalConsent: boolean;
  /** When `dashboard`, only linked Pandit or Admin accounts may sign in. */
  intent?: 'dashboard';
  meta?: SessionMeta;
};

export type AuthUserPayload = {
  id: string;
  phoneNumber: string;
  name: string | null;
  walletBalance: string;
  coinBalance: number;
  createdAt: string;
  profileCompleted: boolean;
  role: UserRole;
};

export type TokenPairResponse = {
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeSeconds: number;
};

export type VerifyOtpResponse = TokenPairResponse & {
  hasProfile: boolean;
  isNewUser: boolean;
  user: AuthUserPayload[];
};

export type RefreshResponse = TokenPairResponse;

export type SocialAuthPendingResponse = {
  needsPhone: true;
  pendingToken: string;
};

export type SocialAuthInput = {
  idToken: string;
  acceptedLegalConsent: boolean;
  firstName?: string | null;
  lastName?: string | null;
  meta?: SessionMeta;
};

export type CompleteSocialInput = {
  pendingToken: string;
  phoneNumber: string;
  otp: string;
  meta?: SessionMeta;
};

@Injectable()
export class AuthService {
  private readonly allowTestOtp: boolean;
  private readonly testOtpAllowlist: Set<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpStore: OtpStoreService,
    private readonly otpRateLimit: OtpRateLimitService,
    private readonly otpSms: OtpSmsService,
    private readonly authSessions: AuthSessionService,
    private readonly googleVerifier: GoogleTokenVerifier,
    private readonly appleVerifier: AppleTokenVerifier,
    private readonly socialPending: SocialPendingStore,
    config: ConfigService,
  ) {
    this.allowTestOtp =
      config.get<string>('ALLOW_TEST_OTP', 'false') === 'true';
    const configuredAllowlist = [
      config.get<string>('TEST_OTP_PHONE_ALLOWLIST', ''),
      config.get<string>('ADMIN_TEST_OTP_PHONE_ALLOWLIST', ''),
    ].join(',');
    this.testOtpAllowlist = new Set(
      configuredAllowlist
        .split(',')
        .map((n) => n.replace(/\D/g, ''))
        .filter((n) => n.length > 0),
    );
  }

  async requestOtp(
    phoneNumber: string,
    clientIp: string,
    intent?: 'dashboard',
  ): Promise<{ success: true; message: string }> {
    if (intent === 'dashboard') {
      await this.assertDashboardAccess(phoneNumber);
    }

    // Reserve SMS quota before send so parallel requests cannot exceed limits.
    await this.otpRateLimit.reserveSend(phoneNumber, clientIp);

    try {
      const otp = String(randomInt(0, 10_000)).padStart(4, '0');
      await this.otpStore.save(phoneNumber, otp);

      // Allowlisted reviewer/demo numbers skip SMS and use the fixed test OTP.
      const skipRealSend = this.isPhoneAllowlisted(phoneNumber);
      if (!skipRealSend) {
        await this.otpSms.sendOtp(phoneNumber, otp);
      } else {
        return {
          success: true,
          message: 'OTP ready for allowlisted test number (SMS not sent)',
        };
      }
    } catch (error) {
      await this.otpRateLimit.releaseReservation(phoneNumber, clientIp);
      throw error;
    }

    return { success: true, message: 'OTP Sent' };
  }

  async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResponse> {
    const { phoneNumber, otp, acceptedLegalConsent, intent } = input;
    const meta = input.meta ?? {};

    if (!acceptedLegalConsent) {
      throw new BadRequestException(
        'You must accept the Terms & Conditions and Privacy Policy to continue',
      );
    }

    await this.otpRateLimit.assertVerifyAllowed(
      phoneNumber,
      meta.ip ?? 'unknown',
    );

    await this.assertOtpValid(phoneNumber, otp);

    if (intent === 'dashboard') {
      await this.assertDashboardAccess(phoneNumber);
    }

    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    const consentAt = new Date();
    const consentData = {
      acceptedAge18: true,
      termsAcceptedAt: consentAt,
      privacyAcceptedAt: consentAt,
      termsVersion: LEGAL_TERMS_VERSION,
      privacyVersion: LEGAL_PRIVACY_VERSION,
    };

    let isNewUser = false;
    if (!user) {
      if (intent === 'dashboard') {
        throw new ForbiddenException(
          'This number is not registered as a PanditTalk expert. Please contact admininfo@pandittalk.com to get dashboard access.',
        );
      }
      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          walletBalance: 0,
          ...consentData,
        },
      });
      isNewUser = true;
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: consentData,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const tokens = await this.issueTokens(user, meta);

    return {
      ...tokens,
      hasProfile: user.profileCompleted,
      isNewUser,
      user: [this.toAuthUserPayload(user)],
    };
  }

  /** Dashboard login only — phone must belong to a linked Pandit or Admin account. */
  private async assertDashboardAccess(phoneNumber: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        isActive: true,
        role: true,
        pandit: { select: { id: true } },
      },
    });

    if (!user?.isActive || (user.role !== 'ADMIN' && !user.pandit)) {
      throw new ForbiddenException(
        'This number is not registered for PanditTalk dashboard access. Please contact admininfo@pandittalk.com.',
      );
    }
  }

  async signInWithGoogle(
    input: SocialAuthInput,
  ): Promise<VerifyOtpResponse | SocialAuthPendingResponse> {
    return this.signInWithSocial('google', input);
  }

  async signInWithApple(
    input: SocialAuthInput,
  ): Promise<VerifyOtpResponse | SocialAuthPendingResponse> {
    return this.signInWithSocial('apple', input);
  }

  async completeSocialAuth(
    input: CompleteSocialInput,
  ): Promise<VerifyOtpResponse> {
    const pending = await this.socialPending.consume(input.pendingToken);
    if (!pending) {
      throw new UnauthorizedException(
        'Google sign-in expired. Please start again.',
      );
    }

    const meta = input.meta ?? {};
    await this.otpRateLimit.assertVerifyAllowed(
      input.phoneNumber,
      meta.ip ?? 'unknown',
    );
    await this.assertOtpValid(input.phoneNumber, input.otp);

    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: input.phoneNumber },
    });

    if (existing) {
      this.assertSocialCanLink(existing, pending);
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          ...this.consentData(),
          ...this.socialLinkPatch(existing, pending),
        },
      });
      if (!user.isActive) {
        throw new UnauthorizedException(
          'User account is inactive or not found',
        );
      }
      return this.toVerifyResponse(user, false, meta);
    }

    const created = await this.prisma.user.create({
      data: {
        phoneNumber: input.phoneNumber,
        walletBalance: 0,
        ...this.consentData(),
        ...this.newUserFromPending(pending),
      },
    });
    return this.toVerifyResponse(created, true, meta);
  }

  async linkGoogle(
    userId: string,
    idToken: string,
  ): Promise<VerifyOtpResponse> {
    const identity = await this.googleVerifier.verify(idToken);
    const current = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!current) {
      throw new UnauthorizedException('User account is inactive or not found');
    }
    if (current.googleSub && current.googleSub !== identity.subject) {
      throw new BadRequestException(
        'This account is already connected to a different Google account.',
      );
    }
    const taken = await this.prisma.user.findFirst({
      where: {
        googleSub: identity.subject,
        NOT: { id: userId },
      },
    });
    if (taken) {
      throw new BadRequestException(
        'This Google account is already used. Sign in with that account.',
      );
    }
    const user = await this.prisma.user.update({
      where: { id: current.id },
      data: this.socialLinkPatch(current, {
        ...identity,
        acceptedLegalConsent: true,
      }),
    });
    return this.toVerifyResponse(user, false, {});
  }

  async refresh(
    rawRefreshToken: string | undefined,
    meta: SessionMeta = {},
  ): Promise<RefreshResponse> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const { userId, issued } = await this.authSessions.rotateSession(
      rawRefreshToken,
      meta,
    );

    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const accessToken = await this.signAccessToken(user);
    return {
      accessToken,
      refreshToken: issued.refreshToken,
      refreshMaxAgeSeconds: issued.maxAgeSeconds,
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }
    await this.authSessions.revokeSession(rawRefreshToken);
  }

  async revokeAllSessions(userId: string): Promise<number> {
    return this.authSessions.revokeAllSessions(userId);
  }

  async getAuthenticatedUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        pandit: { select: { id: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role as UserRole,
      name: user.name || this.composedName(user.firstName, user.lastName),
      panditId: user.pandit?.id ?? null,
    };
  }

  private async issueTokens(
    user: User,
    meta: SessionMeta,
  ): Promise<TokenPairResponse> {
    const issued = await this.authSessions.createSession(user.id, meta);
    const accessToken = await this.signAccessToken(user);
    return {
      accessToken,
      refreshToken: issued.refreshToken,
      refreshMaxAgeSeconds: issued.maxAgeSeconds,
    };
  }

  private async signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private isPhoneAllowlisted(phoneNumber: string): boolean {
    return (
      this.allowTestOtp &&
      this.testOtpAllowlist.has(phoneNumber.replace(/\D/g, ''))
    );
  }

  private async assertOtpValid(
    phoneNumber: string,
    otp: string,
  ): Promise<void> {
    const isTestBypass =
      otp === TEST_OTP &&
      (this.allowTestOtp || this.isPhoneAllowlisted(phoneNumber));
    if (isTestBypass) return;
    const valid = await this.otpStore.verifyAndConsume(phoneNumber, otp);
    if (!valid) {
      throw new BadRequestException('Invalid OTP');
    }
  }

  private async signInWithSocial(
    provider: 'google' | 'apple',
    input: SocialAuthInput,
  ): Promise<VerifyOtpResponse | SocialAuthPendingResponse> {
    if (!input.acceptedLegalConsent) {
      throw new BadRequestException(
        'You must accept the Terms & Conditions and Privacy Policy to continue',
      );
    }

    const verified =
      provider === 'google'
        ? await this.googleVerifier.verify(input.idToken)
        : await this.appleVerifier.verify(input.idToken);

    const identity: SocialIdentity = {
      ...verified,
      firstName: verified.firstName || input.firstName?.trim() || null,
      lastName: verified.lastName || input.lastName?.trim() || null,
    };

    const existing = await this.findUserForSocial(identity);
    if (existing) {
      if (!existing.isActive) {
        throw new UnauthorizedException(
          'User account is inactive or not found',
        );
      }
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          ...this.consentData(),
          ...this.socialLinkPatch(existing, {
            ...identity,
            acceptedLegalConsent: true,
          }),
        },
      });
      return this.toVerifyResponse(user, false, input.meta ?? {});
    }

    const pendingToken = await this.socialPending.save({
      ...identity,
      acceptedLegalConsent: true,
    });
    return { needsPhone: true, pendingToken };
  }

  private async findUserForSocial(
    identity: SocialIdentity,
  ): Promise<User | null> {
    const or: Array<{ googleSub?: string; appleSub?: string; email?: string }> =
      [];
    if (identity.provider === 'google') {
      or.push({ googleSub: identity.subject });
    } else {
      or.push({ appleSub: identity.subject });
    }
    if (identity.email) {
      or.push({ email: identity.email });
    }
    return this.prisma.user.findFirst({
      where: { isActive: true, OR: or },
    });
  }

  private assertSocialCanLink(user: User, pending: SocialPendingRecord): void {
    if (pending.provider === 'google') {
      if (user.googleSub && user.googleSub !== pending.subject) {
        throw new BadRequestException(
          'This number is already registered. Sign in with OTP.',
        );
      }
    }
    if (pending.provider === 'apple') {
      if (user.appleSub && user.appleSub !== pending.subject) {
        throw new BadRequestException(
          'This number is already registered. Sign in with OTP.',
        );
      }
    }
    if (
      user.email &&
      pending.email &&
      user.email.toLowerCase() !== pending.email.toLowerCase() &&
      (user.googleSub || user.appleSub)
    ) {
      throw new BadRequestException(
        'This number is already registered. Sign in with OTP.',
      );
    }
  }

  private consentData() {
    const consentAt = new Date();
    return {
      acceptedAge18: true,
      termsAcceptedAt: consentAt,
      privacyAcceptedAt: consentAt,
      termsVersion: LEGAL_TERMS_VERSION,
      privacyVersion: LEGAL_PRIVACY_VERSION,
    };
  }

  private composedName(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
  ): string | null {
    const composed = [firstName, lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(' ')
      .trim();
    return composed.length > 0 ? composed : null;
  }

  private newUserFromPending(pending: SocialPendingRecord) {
    const name = this.composedName(pending.firstName, pending.lastName);
    return {
      firstName: pending.firstName,
      lastName: pending.lastName,
      name,
      email: pending.email,
      profileImageUrl: pending.pictureUrl,
      googleSub: pending.provider === 'google' ? pending.subject : undefined,
      appleSub: pending.provider === 'apple' ? pending.subject : undefined,
    };
  }

  private socialLinkPatch(user: User, pending: SocialPendingRecord) {
    const name =
      user.name || this.composedName(pending.firstName, pending.lastName);
    return {
      googleSub:
        pending.provider === 'google'
          ? pending.subject
          : (user.googleSub ?? undefined),
      appleSub:
        pending.provider === 'apple'
          ? pending.subject
          : (user.appleSub ?? undefined),
      email: user.email || pending.email || undefined,
      firstName: user.firstName || pending.firstName || undefined,
      lastName: user.lastName || pending.lastName || undefined,
      name: name || undefined,
      profileImageUrl: user.profileImageUrl || pending.pictureUrl || undefined,
    };
  }

  private async toVerifyResponse(
    user: User,
    isNewUser: boolean,
    meta: SessionMeta,
  ): Promise<VerifyOtpResponse> {
    const tokens = await this.issueTokens(user, meta);
    return {
      ...tokens,
      hasProfile: user.profileCompleted,
      isNewUser,
      user: [this.toAuthUserPayload(user)],
    };
  }

  private toAuthUserPayload(user: User): AuthUserPayload {
    const wallet = user.walletBalance.toString();
    const coinBalance = Number(wallet);
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      walletBalance: wallet,
      coinBalance,
      createdAt: user.createdAt.toISOString(),
      profileCompleted: user.profileCompleted,
      role: user.role,
    };
  }
}
