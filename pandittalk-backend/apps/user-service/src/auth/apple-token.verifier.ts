import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';
import type { SocialIdentity } from './social-identity';

@Injectable()
export class AppleTokenVerifier {
  private readonly audience: string;

  constructor(config: ConfigService) {
    this.audience = config.get<string>(
      'APPLE_CLIENT_ID',
      'com.pandittalk.mobile',
    );
  }

  async verify(identityToken: string): Promise<SocialIdentity> {
    if (!identityToken.trim()) {
      throw new UnauthorizedException('Apple sign-in failed');
    }
    try {
      const claims = await appleSignin.verifyIdToken(identityToken, {
        audience: this.audience,
        ignoreExpiration: false,
      });
      const subject = typeof claims.sub === 'string' ? claims.sub : '';
      if (!subject) {
        throw new UnauthorizedException('Apple sign-in failed');
      }
      const email =
        typeof claims.email === 'string'
          ? claims.email.trim().toLowerCase()
          : '';
      return {
        provider: 'apple',
        subject,
        email: email || null,
        firstName: null,
        lastName: null,
        pictureUrl: null,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Apple sign-in failed');
    }
  }
}
