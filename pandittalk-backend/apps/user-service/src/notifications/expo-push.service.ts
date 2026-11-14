import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
};

/**
 * Sends via Expo Push API (works for APNs + FCM once EAS credentials are set).
 * Failures are logged; they never fail the caller.
 */
@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(
    userId: string,
    token: string,
    platform: string,
  ): Promise<{ ok: true }> {
    const cleaned = token.trim();
    const plat = platform.trim().toLowerCase() || 'unknown';
    await this.prisma.pushDevice.upsert({
      where: { token: cleaned },
      create: { userId, token: cleaned, platform: plat },
      update: { userId, platform: plat },
    });
    return { ok: true };
  }

  async unregisterDevice(userId: string, token: string): Promise<{ ok: true }> {
    await this.prisma.pushDevice.deleteMany({
      where: { userId, token: token.trim() },
    });
    return { ok: true };
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const devices = await this.prisma.pushDevice.findMany({
        where: { userId },
        select: { token: true },
      });
      if (devices.length === 0) return;

      const messages: ExpoPushMessage[] = devices.map((d) => ({
        to: d.token,
        title,
        body,
        data,
        sound: 'default',
      }));

      const chunks: ExpoPushMessage[][] = [];
      for (let i = 0; i < messages.length; i += 100) {
        chunks.push(messages.slice(i, i + 100));
      }

      for (const chunk of chunks) {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          this.logger.warn(
            `Expo push HTTP ${res.status}: ${text.slice(0, 200)}`,
          );
          continue;
        }
        const json = (await res.json().catch(() => null)) as {
          data?: Array<{ status?: string; details?: { error?: string } }>;
        } | null;
        const tickets = json?.data ?? [];
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket?.status === 'error') {
            const err = ticket.details?.error;
            if (err === 'DeviceNotRegistered') {
              await this.prisma.pushDevice
                .deleteMany({ where: { token: chunk[i].to } })
                .catch(() => undefined);
            } else {
              this.logger.warn(`Expo push ticket error: ${err ?? 'unknown'}`);
            }
          }
        }
      }
    } catch (e) {
      this.logger.warn(
        `Expo push failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
