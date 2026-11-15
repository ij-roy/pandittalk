import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AudioSessionController } from './audio-session.controller';
import { VideoSessionController } from './video-session.controller';
import { WebRtcService } from './webrtc.service';

@Module({
  imports: [ConfigModule],
  controllers: [AudioSessionController, VideoSessionController],
  providers: [WebRtcService],
  exports: [WebRtcService],
})
export class WebRtcModule {}
