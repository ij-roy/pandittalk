import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService, type SocialAuthPendingResponse, type VerifyOtpResponse } from './auth.service';
import { clientIp } from './client-ip.util';
import { AppleAuthDto } from './dto/apple-auth.dto';
import { CompleteSocialDto } from './dto/complete-social.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LinkGoogleDto } from './dto/link-google.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { OtpRateLimitException } from './exceptions/otp-rate-limit.exception';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from './refresh-cookie.util';

@Controller('auth')
export class AuthController {
  private readonly cookieSecure: boolean;

  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    const explicit = config.get<string>('COOKIE_SECURE');
    if (explicit === 'true') {
      this.cookieSecure = true;
    } else if (explicit === 'false') {
      this.cookieSecure = false;
    } else {
      this.cookieSecure = config.get<string>('NODE_ENV') === 'production';
    }
  }

  @Post('request-otp')
  async requestOtp(
    @Body() requestOtpDto: RequestOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return await this.authService.requestOtp(
        requestOtpDto.phoneNumber,
        clientIp(req),
        requestOtpDto.intent,
      );
    } catch (error) {
      if (error instanceof OtpRateLimitException) {
        res.setHeader('Retry-After', String(error.retryAfterSeconds));
      }
      throw error;
    }
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.verifyOtp({
        phoneNumber: verifyOtpDto.phoneNumber,
        otp: verifyOtpDto.otp,
        acceptedLegalConsent: verifyOtpDto.acceptedLegalConsent,
        intent: verifyOtpDto.intent,
        meta: {
          ip: clientIp(req),
          userAgent: req.headers['user-agent'],
        },
      });

      setRefreshCookie(res, result.refreshToken, {
        maxAgeSeconds: result.refreshMaxAgeSeconds,
        secure: this.cookieSecure,
      });

      return result;
    } catch (error) {
      if (error instanceof OtpRateLimitException) {
        res.setHeader('Retry-After', String(error.retryAfterSeconds));
      }
      throw error;
    }
  }

  @Post('google')
  async google(
    @Body() body: GoogleAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signInWithGoogle({
      idToken: body.idToken,
      acceptedLegalConsent: body.acceptedLegalConsent,
      meta: {
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
      },
    });
    this.maybeSetRefreshCookie(res, result);
    return result;
  }

  @Post('apple')
  async apple(
    @Body() body: AppleAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signInWithApple({
      idToken: body.identityToken,
      acceptedLegalConsent: body.acceptedLegalConsent,
      firstName: body.firstName,
      lastName: body.lastName,
      meta: {
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
      },
    });
    this.maybeSetRefreshCookie(res, result);
    return result;
  }

  @Post('complete-social')
  async completeSocial(
    @Body() body: CompleteSocialDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.completeSocialAuth({
        pendingToken: body.pendingToken,
        phoneNumber: body.phoneNumber,
        otp: body.otp,
        meta: {
          ip: clientIp(req),
          userAgent: req.headers['user-agent'],
        },
      });
      setRefreshCookie(res, result.refreshToken, {
        maxAgeSeconds: result.refreshMaxAgeSeconds,
        secure: this.cookieSecure,
      });
      return result;
    } catch (error) {
      if (error instanceof OtpRateLimitException) {
        res.setHeader('Retry-After', String(error.retryAfterSeconds));
      }
      throw error;
    }
  }

  @Post('link-google')
  @UseGuards(JwtAuthGuard)
  async linkGoogle(
    @CurrentUser('sub') userId: string,
    @Body() body: LinkGoogleDto,
  ) {
    return this.authService.linkGoogle(userId, body.idToken);
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw =
      (typeof body?.refreshToken === 'string' && body.refreshToken.trim()) ||
      readRefreshCookie(req);

    const result = await this.authService.refresh(raw || undefined, {
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
    });

    setRefreshCookie(res, result.refreshToken, {
      maxAgeSeconds: result.refreshMaxAgeSeconds,
      secure: this.cookieSecure,
    });

    return result;
  }

  @Post('logout')
  async logout(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw =
      (typeof body?.refreshToken === 'string' && body.refreshToken.trim()) ||
      readRefreshCookie(req);

    await this.authService.logout(raw || undefined);
    clearRefreshCookie(res, this.cookieSecure);
    return { success: true };
  }

  private maybeSetRefreshCookie(
    res: Response,
    result: VerifyOtpResponse | SocialAuthPendingResponse,
  ): void {
    if ('needsPhone' in result) {
      return;
    }
    setRefreshCookie(res, result.refreshToken, {
      maxAgeSeconds: result.refreshMaxAgeSeconds,
      secure: this.cookieSecure,
    });
  }
}
