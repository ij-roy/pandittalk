import { ConfigService } from '@nestjs/config';
import { buildRedisUrl } from './redis-url';

describe('buildRedisUrl', () => {
  it('prefers an explicitly configured Redis URL', () => {
    const config = new ConfigService({
      REDIS_URL: 'rediss://user:p%40ss@redis.example.com:6380/2?family=0',
      REDIS_HOST: 'ignored.example.com',
      REDIS_PORT: '6379',
    });

    expect(buildRedisUrl(config)).toBe(
      'rediss://user:p%40ss@redis.example.com:6380/2?family=0',
    );
  });

  it('falls back to local Redis host and port', () => {
    const config = new ConfigService({
      REDIS_HOST: 'redis.internal',
      REDIS_PORT: '6380',
    });

    expect(buildRedisUrl(config)).toBe('redis://redis.internal:6380');
  });

  it('preserves TLS credentials and query parameters without rebuilding them', () => {
    const url = 'rediss://:s3cr%40t@redis.example.com:6380/0?tls=true';

    expect(buildRedisUrl(new ConfigService({ REDIS_URL: url }))).toBe(url);
  });
});
