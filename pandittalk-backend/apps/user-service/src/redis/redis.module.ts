import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { RedisClientService } from './redis-client.service';
import { buildRedisUrl } from './redis-url';

export function buildRedisCacheStore(config: ConfigService) {
  return createKeyv(buildRedisUrl(config));
}

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [buildRedisCacheStore(config)],
      }),
    }),
  ],
  providers: [RedisClientService],
  exports: [CacheModule, RedisClientService],
})
export class RedisModule {}
