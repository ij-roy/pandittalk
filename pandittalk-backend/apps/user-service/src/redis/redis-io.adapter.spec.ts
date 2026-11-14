import { ConfigService } from '@nestjs/config';
import { buildRedisUrl } from './redis-io.adapter';

describe('buildRedisUrl', () => {
  it('uses the configured Redis host and port', () => {
    const config = new ConfigService({
      REDIS_HOST: 'redis.internal',
      REDIS_PORT: '6380',
    });

    expect(buildRedisUrl(config)).toBe('redis://redis.internal:6380');
  });

  it('falls back to local Redis defaults', () => {
    expect(buildRedisUrl(new ConfigService())).toBe('redis://localhost:6379');
  });
});
