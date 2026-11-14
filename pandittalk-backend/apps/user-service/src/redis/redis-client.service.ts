import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisClientService.name);
  private client!: RedisClientType;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = this.config.get<string>('REDIS_PORT', '6379');
    const url = `redis://${host}:${port}`;

    this.client = createClient({ url });
    this.client.on('error', (err) => {
      this.logger.error('Redis client error', err);
    });
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  /** Increment key; set TTL on first increment. Returns new count. */
  async incrWithExpire(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  /** TTL in seconds; -2 if missing, -1 if no expiry. */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /** PTTL in milliseconds; -2 if missing. */
  async pttl(key: string): Promise<number> {
    return this.client.pTTL(key);
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async getInt(key: string): Promise<number> {
    const value = await this.client.get(key);
    if (value === null) {
      return 0;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.client.set(key, value, { PX: ttlMs });
  }

  async setIfAbsent(
    key: string,
    value: string,
    ttlMs: number,
  ): Promise<boolean> {
    const result = await this.client.set(key, value, { NX: true, PX: ttlMs });
    return result === 'OK';
  }

  async releaseLock(key: string, value: string): Promise<void> {
    await this.client.eval(
      `
        if redis.call('get', KEYS[1]) == ARGV[1] then
          return redis.call('del', KEYS[1])
        end
        return 0
      `,
      {
        keys: [key],
        arguments: [value],
      },
    );
  }

  /**
   * Run a Lua script atomically. `keys` map to KEYS[]; `args` to ARGV[].
   */
  async eval<T = unknown>(
    script: string,
    keys: string[],
    args: Array<string | number> = [],
  ): Promise<T> {
    return this.client.eval(script, {
      keys,
      arguments: args.map(String),
    }) as Promise<T>;
  }
}
