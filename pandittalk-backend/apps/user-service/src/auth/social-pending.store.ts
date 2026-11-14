import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { RedisClientService } from '../redis/redis-client.service';
import type { SocialPendingRecord } from './social-identity';

export const SOCIAL_PENDING_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class SocialPendingStore {
  constructor(private readonly redis: RedisClientService) {}

  private key(token: string): string {
    return `social_pending:${token}`;
  }

  async save(record: SocialPendingRecord): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(
      this.key(token),
      JSON.stringify(record),
      SOCIAL_PENDING_TTL_MS,
    );
    return token;
  }

  async consume(token: string): Promise<SocialPendingRecord | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const raw = await this.redis.get(this.key(trimmed));
    if (!raw) return null;
    await this.redis.del(this.key(trimmed));
    try {
      return JSON.parse(raw) as SocialPendingRecord;
    } catch {
      return null;
    }
  }
}
