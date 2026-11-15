import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WebRtcIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface WebRtcSessionConfig {
  provider: 'webrtc';
  bookingId: string;
  format: 'audio' | 'video';
  iceServers: WebRtcIceServer[];
}

@Injectable()
export class WebRtcService {
  constructor(private readonly configService: ConfigService) {}

  getSessionConfig(
    bookingId: string,
    format: 'audio' | 'video',
  ): WebRtcSessionConfig {
    return {
      provider: 'webrtc',
      bookingId,
      format,
      iceServers: this.getIceServers(),
    };
  }

  private getIceServers(): WebRtcIceServer[] {
    const stunUrls = this.configService
      .get<string>(
        'WEBRTC_STUN_URLS',
        'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302',
      )
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    const servers: WebRtcIceServer[] = stunUrls.map((urls) => ({ urls }));
    const turnUrl = this.configService.get<string>('WEBRTC_TURN_URL')?.trim();
    const turnUsername = this.configService
      .get<string>('WEBRTC_TURN_USERNAME')
      ?.trim();
    const turnCredential = this.configService
      .get<string>('WEBRTC_TURN_CREDENTIAL')
      ?.trim();

    if (turnUrl && turnUsername && turnCredential) {
      servers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    return servers.length > 0
      ? servers
      : [{ urls: 'stun:stun.l.google.com:19302' }];
  }
}
