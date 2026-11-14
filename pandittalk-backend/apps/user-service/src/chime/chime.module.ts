import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { ChimeController } from './chime.controller';
import { ChimeService } from './chime.service';
import { VideoChimeController } from './video-chime.controller';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [ChimeController, VideoChimeController],
  providers: [ChimeService],
  exports: [ChimeService],
})
export class ChimeModule {}
