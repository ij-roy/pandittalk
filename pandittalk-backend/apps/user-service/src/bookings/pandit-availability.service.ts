import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { isPanditPresent } from '../experts/presence-fresh';

const QUEUE_KEY_PREFIX = 'pandit:queue:';
const MAX_QUEUE_DEPTH = 5;

export interface PanditLiveStatus {
  panditId: string;
  state: 'available' | 'busy' | 'offline';
  activeBookingId: string | null;
  estimatedAvailableAt: string | null;
  queueLength: number;
  maxQueueDepth: number;
  canJoinQueue: boolean;
}

export interface PanditActiveSession {
  bookingId: string;
  estimatedFreeAt: Date;
}

const SESSION_END_PREFIX = 'session:end:';

@Injectable()
export class PanditAvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  panditActiveKey(panditId: string): string {
    return `pandit:active:${panditId}`;
  }

  async markPanditActive(
    panditId: string,
    bookingId: string,
    ttlMs: number,
  ): Promise<void> {
    await this.cacheManager.set(
      this.panditActiveKey(panditId),
      bookingId,
      ttlMs,
    );
  }

  async clearPanditActive(panditId: string): Promise<void> {
    await this.cacheManager.del(this.panditActiveKey(panditId));
  }

  async getActiveBookingId(panditId: string): Promise<string | null> {
    const active = await this.cacheManager.get<string>(
      this.panditActiveKey(panditId),
    );
    return active ?? null;
  }

  async getActiveSession(
    panditId: string,
  ): Promise<PanditActiveSession | null> {
    const bookingId = await this.getActiveBookingId(panditId);
    if (!bookingId) {
      const dbActive = await this.findDbActiveBooking(panditId);
      if (!dbActive) {
        return null;
      }
      return {
        bookingId: dbActive.id,
        estimatedFreeAt: dbActive.endTime,
      };
    }

    const sessionEnd = await this.cacheManager.get<number>(
      `${SESSION_END_PREFIX}${bookingId}`,
    );
    if (sessionEnd !== undefined && sessionEnd !== null) {
      return { bookingId, estimatedFreeAt: new Date(sessionEnd) };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { endTime: true },
    });
    if (!booking) {
      return { bookingId, estimatedFreeAt: new Date() };
    }
    return { bookingId, estimatedFreeAt: booking.endTime };
  }

  async isPanditBusyWithOtherBooking(
    panditId: string,
    bookingId: string,
  ): Promise<boolean> {
    const active = await this.getActiveSession(panditId);
    if (!active) {
      return false;
    }
    return active.bookingId !== bookingId;
  }

  async hasOverlappingConfirmedBooking(panditId: string): Promise<boolean> {
    const now = new Date();
    const overlap = await this.prisma.booking.findFirst({
      where: {
        panditId,
        status: 'confirmed',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: { id: true },
    });
    return overlap !== null;
  }

  async getLiveStatus(panditId: string): Promise<PanditLiveStatus> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { id: panditId },
      select: { isOnline: true, presenceSeenAt: true },
    });

    if (!pandit) {
      return {
        panditId,
        state: 'offline',
        activeBookingId: null,
        estimatedAvailableAt: null,
        queueLength: 0,
        maxQueueDepth: MAX_QUEUE_DEPTH,
        canJoinQueue: false,
      };
    }

    const queueLength = await this.getQueueLength(panditId);
    const maxQueueDepth = MAX_QUEUE_DEPTH;

    if (!isPanditPresent(pandit)) {
      return {
        panditId,
        state: 'offline',
        activeBookingId: null,
        estimatedAvailableAt: null,
        queueLength,
        maxQueueDepth,
        canJoinQueue: false,
      };
    }

    const active = await this.getActiveSession(panditId);
    const dbBusy = active === null && (await this.hasOverlappingConfirmedBooking(panditId));

    if (active || dbBusy) {
      const estimatedFreeAt = active?.estimatedFreeAt ?? null;
      return {
        panditId,
        state: 'busy',
        activeBookingId: active?.bookingId ?? null,
        estimatedAvailableAt: estimatedFreeAt?.toISOString() ?? null,
        queueLength,
        maxQueueDepth,
        canJoinQueue: queueLength < maxQueueDepth,
      };
    }

    return {
      panditId,
      state: 'available',
      activeBookingId: null,
      estimatedAvailableAt: null,
      queueLength,
      maxQueueDepth,
      canJoinQueue: queueLength < maxQueueDepth,
    };
  }

  private async getQueueLength(panditId: string): Promise<number> {
    const raw = await this.cacheManager.get<unknown[]>(
      `${QUEUE_KEY_PREFIX}${panditId}`,
    );
    return Array.isArray(raw) ? raw.length : 0;
  }

  private async findDbActiveBooking(panditId: string) {
    const now = new Date();
    return this.prisma.booking.findFirst({
      where: {
        panditId,
        status: 'confirmed',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: { id: true, endTime: true },
    });
  }
}
