import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(WebRtcService.name);

  constructor(private readonly configService: ConfigService) {}

  async getSessionConfig(
    bookingId: string,
    format: 'audio' | 'video',
  ): Promise<WebRtcSessionConfig> {
    const cloudflareIceServers = await this.getCloudflareIceServers();

    return {
      provider: 'webrtc',
      bookingId,
      format,
      iceServers: cloudflareIceServers ?? this.getIceServers(),
    };
  }

  private async getCloudflareIceServers(): Promise<WebRtcIceServer[] | null> {
    const keyId = this.configService
      .get<string>('CLOUDFLARE_TURN_KEY_ID')
      ?.trim();
    const apiToken = this.configService
      .get<string>('CLOUDFLARE_TURN_API_TOKEN')
      ?.trim();

    if (!keyId || !apiToken) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ttl: this.getCloudflareCredentialTtl() }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        this.logger.warn(
          'Cloudflare TURN credentials unavailable; using fallback ICE servers',
        );
        return null;
      }

      const payload: unknown = await response.json();
      const iceServers = this.parseCloudflareIceServers(payload);
      if (!iceServers) {
        this.logger.warn(
          'Cloudflare TURN response invalid; using fallback ICE servers',
        );
      }
      return iceServers;
    } catch {
      this.logger.warn(
        'Cloudflare TURN credentials unavailable; using fallback ICE servers',
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private getCloudflareCredentialTtl(): number {
    const configuredTtl = Number(
      this.configService.get<string>(
        'CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS',
        '86400',
      ),
    );

    return Number.isInteger(configuredTtl) &&
      configuredTtl >= 1 &&
      configuredTtl <= 172800
      ? Math.floor(configuredTtl)
      : 86400;
  }

  private parseCloudflareIceServers(
    payload: unknown,
  ): WebRtcIceServer[] | null {
    if (!this.isRecord(payload) || !Array.isArray(payload.iceServers)) {
      return null;
    }

    const iceServers: WebRtcIceServer[] = [];
    for (const candidate of payload.iceServers) {
      if (!this.isRecord(candidate)) {
        return null;
      }

      const urls = this.parseIceServerUrls(candidate.urls);
      if (!urls) {
        return null;
      }

      const urlList = Array.isArray(urls) ? urls : [urls];
      const hasTurnServer = urlList.some((url) => /^(turn|turns):/i.test(url));
      const username =
        typeof candidate.username === 'string' && candidate.username.trim()
          ? candidate.username
          : undefined;
      const credential =
        typeof candidate.credential === 'string' && candidate.credential.trim()
          ? candidate.credential
          : undefined;

      if (hasTurnServer && (!username || !credential)) {
        return null;
      }

      const iceServer: WebRtcIceServer = { urls };
      if (username) {
        iceServer.username = username;
      }
      if (credential) {
        iceServer.credential = credential;
      }
      iceServers.push(iceServer);
    }

    return iceServers.length > 0 ? iceServers : null;
  }

  private parseIceServerUrls(value: unknown): string | string[] | null {
    if (typeof value === 'string' && this.isIceServerUrl(value)) {
      return value.trim();
    }

    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((url) => typeof url === 'string' && this.isIceServerUrl(url))
    ) {
      return value.map((url) => url.trim());
    }

    return null;
  }

  private isIceServerUrl(value: string): boolean {
    return /^(stun|stuns|turn|turns):[^\s,]+$/i.test(value.trim());
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
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
