import type { Cache } from 'cache-manager';
import type { ChatGateway } from '../chat/chat.gateway';
import type { PrismaService } from '../prisma/prisma.service';
import { BOOKING_CATALOG } from './booking-catalog';
import { PanditQueueService } from './pandit-queue.service';

describe('PanditQueueService', () => {
  it('returns the catalogue-derived wait estimate for a queued user', async () => {
    const cache = {
      get: jest.fn().mockResolvedValue([
        { userId: 'user-a', enqueuedAt: Date.now() },
        { userId: 'user-b', enqueuedAt: Date.now() },
        { userId: 'user-c', enqueuedAt: Date.now() },
      ]),
    } as unknown as Cache;
    const service = new PanditQueueService(
      {} as PrismaService,
      cache,
      {} as ChatGateway,
    );

    await expect(service.getPosition('user-b', 'pandit-a')).resolves.toEqual({
      position: 2,
      queueLength: 3,
      estimatedWaitMinutes: 2 * BOOKING_CATALOG.chatNow.durationMinutes,
    });
  });
});
