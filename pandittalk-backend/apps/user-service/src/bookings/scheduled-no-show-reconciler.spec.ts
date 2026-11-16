import { BOOKING_CATALOG } from './booking-catalog';
import { BookingsService } from './bookings.service';

describe('scheduled no-show reconciliation', () => {
  it('asks the chat gateway to refund every expired scheduled AV booking', async () => {
    const now = new Date('2026-11-16T12:10:00.000Z');
    const expiredAudio = {
      id: 'booking-audio',
      format: 'audio',
      startTime: new Date('2026-11-16T12:00:00.000Z'),
    };
    const expiredVideo = {
      id: 'booking-video',
      format: 'video',
      startTime: new Date('2026-11-16T12:00:00.000Z'),
    };
    const prisma = {
      booking: {
        findMany: jest.fn().mockResolvedValue([expiredAudio, expiredVideo]),
      },
    };
    const chatGateway = {
      handleAvNoShowTimeout: jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    };
    const service = Object.create(BookingsService.prototype) as any;
    service.prisma = prisma;
    service.chatGateway = chatGateway;

    const refunded = await service.reconcileScheduledNoShows(now);

    expect(refunded).toBe(1);
    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        status: 'confirmed',
        format: { in: ['audio', 'video'] },
        sessionModel: { not: 'no_timer' },
        startTime: {
          lte: new Date(
            now.getTime() -
              BOOKING_CATALOG.cancellation.noShowRefundMinutes * 60 * 1000,
          ),
        },
      },
      select: { id: true, format: true, startTime: true },
      take: 100,
    });
    expect(chatGateway.handleAvNoShowTimeout).toHaveBeenNthCalledWith(
      1,
      'booking-audio',
      'audio',
    );
    expect(chatGateway.handleAvNoShowTimeout).toHaveBeenNthCalledWith(
      2,
      'booking-video',
      'video',
    );
  });
});
