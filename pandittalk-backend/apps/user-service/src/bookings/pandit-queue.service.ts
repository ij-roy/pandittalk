import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ChatGateway } from '../chat/chat.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { isPanditPresent } from '../experts/presence-fresh';
import type {
  QueuePositionUpdatedPayload,
  QueueReadyPayload,
} from '../chat/types/chat.types';
import { BOOKING_CATALOG } from './booking-catalog';

export interface QueueEntry {
  userId: string;
  enqueuedAt: number;
}

export interface QueueJoinResult {
  position: number;
  estimatedWaitMinutes: number;
  queueLength: number;
}

export interface QueuePositionResult {
  position: number | null;
  queueLength: number;
  estimatedWaitMinutes: number;
}

@Injectable()
export class PanditQueueService {
  static readonly MAX_QUEUE_DEPTH = BOOKING_CATALOG.chatNow.maxQueueDepth;
  static readonly MAX_QUEUE_WAIT_MS = BOOKING_CATALOG.chatNow.maxQueueWaitMinutes * 60 * 1000;
  static readonly QUEUE_TURN_TIMEOUT_MS = BOOKING_CATALOG.chatNow.queueTurnTimeoutSeconds * 1000;

  private readonly turnTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  queueKey(panditId: string): string {
    return `pandit:queue:${panditId}`;
  }

  queueTurnKey(panditId: string): string {
    return `pandit:queue:turn:${panditId}`;
  }

  queueRoom(panditId: string): string {
    return `queue:${panditId}`;
  }

  async getQueueLength(panditId: string): Promise<number> {
    const queue = await this.getQueue(panditId);
    return queue.length;
  }

  async joinQueue(userId: string, panditId: string): Promise<QueueJoinResult> {
    const chatNowQueueEnabled = true;
    if (!chatNowQueueEnabled) {
      throw new ServiceUnavailableException(
        'The instant-chat queue is temporarily unavailable. Joining does not create a booking or charge.',
      );
    }

    const pandit = await this.prisma.pandit.findUnique({
      where: { id: panditId },
      select: { isOnline: true, presenceSeenAt: true },
    });

    if (!pandit) {
      throw new NotFoundException('Pandit not found');
    }

    if (!isPanditPresent(pandit)) {
      throw new BadRequestException('Pandit is offline');
    }

    const queue = await this.pruneQueue(
      panditId,
      await this.getQueue(panditId),
    );

    if (queue.some((entry) => entry.userId === userId)) {
      throw new BadRequestException('You are already in the queue');
    }

    if (queue.length >= PanditQueueService.MAX_QUEUE_DEPTH) {
      throw new BadRequestException('Queue is full. Please try again later.');
    }

    queue.push({ userId, enqueuedAt: Date.now() });
    await this.saveQueue(panditId, queue);

    const position = queue.length;
    await this.broadcastPositions(panditId, queue);

    return {
      position,
      estimatedWaitMinutes: this.estimatedWaitMinutes(position),
      queueLength: queue.length,
    };
  }

  async leaveQueue(userId: string, panditId: string): Promise<void> {
    const queue = await this.pruneQueue(
      panditId,
      await this.getQueue(panditId),
    );
    const filtered = queue.filter((entry) => entry.userId !== userId);

    if (filtered.length === queue.length) {
      return;
    }

    await this.saveQueue(panditId, filtered);
    await this.broadcastPositions(panditId, filtered);

    const turnUser = await this.cacheManager.get<string>(
      this.queueTurnKey(panditId),
    );
    if (turnUser === userId) {
      await this.cacheManager.del(this.queueTurnKey(panditId));
      this.clearTurnTimeout(panditId);
      await this.processNextInQueue(panditId);
    }
  }

  async getPosition(
    userId: string,
    panditId: string,
  ): Promise<QueuePositionResult> {
    const queue = await this.pruneQueue(
      panditId,
      await this.getQueue(panditId),
    );
    const index = queue.findIndex((entry) => entry.userId === userId);
    return {
      position: index === -1 ? null : index + 1,
      queueLength: queue.length,
      estimatedWaitMinutes: index === -1 ? 0 : this.estimatedWaitMinutes(index + 1),
    };
  }

  async removeUserFromQueue(userId: string, panditId: string): Promise<void> {
    const queue = await this.pruneQueue(
      panditId,
      await this.getQueue(panditId),
    );
    const filtered = queue.filter((entry) => entry.userId !== userId);
    if (filtered.length !== queue.length) {
      await this.saveQueue(panditId, filtered);
      await this.broadcastPositions(panditId, filtered);
    }
    const turnUser = await this.cacheManager.get<string>(
      this.queueTurnKey(panditId),
    );
    if (turnUser === userId) {
      await this.cacheManager.del(this.queueTurnKey(panditId));
      this.clearTurnTimeout(panditId);
    }
  }

  async clearTurn(panditId: string): Promise<void> {
    await this.cacheManager.del(this.queueTurnKey(panditId));
    this.clearTurnTimeout(panditId);
  }

  async processNextInQueue(panditId: string): Promise<void> {
    const existingTurn = await this.cacheManager.get<string>(
      this.queueTurnKey(panditId),
    );
    if (existingTurn) {
      return;
    }

    let queue = await this.pruneQueue(panditId, await this.getQueue(panditId));

    while (queue.length > 0) {
      const next = queue[0];
      queue = queue.slice(1);
      await this.saveQueue(panditId, queue);
      await this.broadcastPositions(panditId, queue);

      const pandit = await this.prisma.pandit.findUnique({
        where: { id: panditId },
        select: { isOnline: true, presenceSeenAt: true },
      });

      if (!pandit || !isPanditPresent(pandit)) {
        this.chatGateway.emitQueueExpired(next.userId, {
          panditId,
          reason: 'pandit_offline',
        });
        continue;
      }

      const expiresAt = new Date(
        Date.now() + PanditQueueService.QUEUE_TURN_TIMEOUT_MS,
      );
      await this.cacheManager.set(
        this.queueTurnKey(panditId),
        next.userId,
        PanditQueueService.QUEUE_TURN_TIMEOUT_MS,
      );

      const payload: QueueReadyPayload = {
        panditId,
        expiresAt: expiresAt.toISOString(),
        message:
          'It is your turn! Start a chat within 60 seconds before the slot passes to the next person.',
      };
      this.chatGateway.emitQueueReady(next.userId, payload);

      this.clearTurnTimeout(panditId);
      const timeout = setTimeout(() => {
        void this.handleTurnTimeout(panditId, next.userId);
      }, PanditQueueService.QUEUE_TURN_TIMEOUT_MS);
      this.turnTimeouts.set(panditId, timeout);

      return;
    }
  }

  private async handleTurnTimeout(
    panditId: string,
    userId: string,
  ): Promise<void> {
    this.turnTimeouts.delete(panditId);
    const turnUser = await this.cacheManager.get<string>(
      this.queueTurnKey(panditId),
    );
    if (turnUser !== userId) {
      return;
    }

    await this.cacheManager.del(this.queueTurnKey(panditId));
    this.chatGateway.emitQueueExpired(userId, {
      panditId,
      reason: 'turn_timeout',
    });
    await this.processNextInQueue(panditId);
  }

  private clearTurnTimeout(panditId: string): void {
    const timeout = this.turnTimeouts.get(panditId);
    if (timeout) {
      clearTimeout(timeout);
      this.turnTimeouts.delete(panditId);
    }
  }

  private async getQueue(panditId: string): Promise<QueueEntry[]> {
    const raw = await this.cacheManager.get<QueueEntry[]>(
      this.queueKey(panditId),
    );
    return Array.isArray(raw) ? raw : [];
  }

  private async saveQueue(
    panditId: string,
    queue: QueueEntry[],
  ): Promise<void> {
    const ttlMs = PanditQueueService.MAX_QUEUE_WAIT_MS + 60_000;
    await this.cacheManager.set(this.queueKey(panditId), queue, ttlMs);
  }

  private async pruneQueue(
    panditId: string,
    queue: QueueEntry[],
  ): Promise<QueueEntry[]> {
    const now = Date.now();
    const pruned = queue.filter(
      (entry) => now - entry.enqueuedAt < PanditQueueService.MAX_QUEUE_WAIT_MS,
    );

    const expired = queue.filter(
      (entry) => now - entry.enqueuedAt >= PanditQueueService.MAX_QUEUE_WAIT_MS,
    );

    for (const entry of expired) {
      this.chatGateway.emitQueueExpired(entry.userId, {
        panditId,
        reason: 'max_wait',
      });
    }

    return pruned;
  }

  private async broadcastPositions(
    panditId: string,
    queue: QueueEntry[],
  ): Promise<void> {
    queue.forEach((entry, index) => {
      const payload: QueuePositionUpdatedPayload = {
        panditId,
        position: index + 1,
        queueLength: queue.length,
        estimatedWaitMinutes: this.estimatedWaitMinutes(index + 1),
      };
      this.chatGateway.emitQueuePositionUpdated(entry.userId, payload);
    });
  }

  private estimatedWaitMinutes(position: number): number {
    return position * BOOKING_CATALOG.chatNow.durationMinutes;
  }
}
