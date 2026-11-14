import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { SocialIdentity } from './social-identity';

@Injectable()
export class GoogleTokenVerifier {
  private readonly client = new OAuth2Client();
  private readonly audiences: string[];

  constructor(config: ConfigService) {
    this.audiences = (config.get<string>('GOOGLE_CLIENT_IDS', '') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  async verify(idToken: string): Promise<SocialIdentity> {
    if (!idToken.trim()) {
      throw new UnauthorizedException('Google sign-in failed');
    }
    if (this.audiences.length === 0) {
      throw new UnauthorizedException('Google sign-in is not configured');
    }
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.audiences,
      });
      const payload = ticket.getPayload();
      const subject = payload?.sub;
      if (!subject) {
        throw new UnauthorizedException('Google sign-in failed');
      }
      const given = payload.given_name?.trim() || null;
      const family = payload.family_name?.trim() || null;
      const full = payload.name?.trim() || '';
      const [fallbackFirst, ...rest] = full.split(/\s+/);
      return {
        provider: 'google',
        subject,
        email: payload.email?.trim().toLowerCase() || null,
        firstName: given ?? (fallbackFirst || null),
        lastName: family ?? (rest.length ? rest.join(' ') : null),
        pictureUrl: payload.picture?.trim() || null,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Google sign-in failed');
    }
  }
}
