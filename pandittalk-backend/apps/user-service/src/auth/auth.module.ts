import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AppleTokenVerifier } from './apple-token.verifier';
import { GoogleTokenVerifier } from './google-token.verifier';
import { JwtStrategy } from './jwt.strategy';
import { OtpRateLimitService } from './otp-rate-limit.service';
import { OtpStoreService } from './otp-store.service';
import { SocialPendingStore } from './social-pending.store';
import { ConsoleOtpSmsProvider } from './sms/console-otp-sms.provider';
import { Msg91OtpSmsProvider } from './sms/msg91-otp-sms.provider';
import { OtpSmsService } from './sms/otp-sms.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '15m');
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as unknown as number,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSessionService,
    JwtStrategy,
    OtpStoreService,
    OtpRateLimitService,
    SocialPendingStore,
    GoogleTokenVerifier,
    AppleTokenVerifier,
    ConsoleOtpSmsProvider,
    Msg91OtpSmsProvider,
    OtpSmsService,
  ],
  exports: [AuthService, AuthSessionService, JwtStrategy, OtpSmsService],
})
export class AuthModule {}
