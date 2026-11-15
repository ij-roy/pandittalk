import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { buildRedisCacheStore } from './redis.module';

jest.mock('@keyv/redis', () => ({
  createKeyv: jest.fn((url: string) => ({ url })),
}));

describe('buildRedisCacheStore', () => {
  it('uses the same managed Redis URL as the other Redis clients', () => {
    const url = 'rediss://user:p%40ss@redis.example.com:6380/0?tls=true';

    buildRedisCacheStore(new ConfigService({ REDIS_URL: url }));

    expect(createKeyv).toHaveBeenCalledWith(url);
  });
});
