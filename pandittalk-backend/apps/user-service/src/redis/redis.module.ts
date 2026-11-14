import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { RedisClientService } from './redis-client.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [
          createKeyv(
            `redis://${config.get<string>('REDIS_HOST', 'localhost')}:${config.get<string>('REDIS_PORT', '6379')}`,
          ),
        ],
      }),
    }),
  ],
  providers: [RedisClientService],
  exports: [CacheModule, RedisClientService],
})
export class RedisModule {}
