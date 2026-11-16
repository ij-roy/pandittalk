import { ChatGateway } from './chat.gateway';

describe('ChatGateway scheduled AV no-show recovery', () => {
  it.each(['audio', 'video'] as const)(
    'refunds a scheduled %s room when the Pandit never joins',
    async (kind) => {
      const emit = jest.fn();
      const gateway = Object.create(ChatGateway.prototype) as any;
      gateway.prisma = {
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-a',
            panditId: 'pandit-a',
            status: 'confirmed',
            startTime: new Date(Date.now() - 20 * 60 * 1000),
          }),
        },
      };
      gateway.bookingsService = {
        cancelWithRefund: jest.fn().mockResolvedValue({
          applied: true,
          coinsRefunded: 151,
        }),
      };
      gateway.server = { to: jest.fn().mockReturnValue({ emit }) };
      gateway.panditAvailability = {
        clearPanditActive: jest.fn().mockResolvedValue(undefined),
      };
      gateway.hasAudioSessionStarted = jest.fn().mockResolvedValue(false);
      gateway.hasVideoSessionStarted = jest.fn().mockResolvedValue(false);
      gateway.getAudioRoomParticipantCount = jest.fn().mockResolvedValue(1);
      gateway.getVideoRoomParticipantCount = jest.fn().mockResolvedValue(1);
      gateway.clearAudioWaitTimeout = jest.fn();
      gateway.clearAudioSessionTimer = jest.fn();
      gateway.clearAudioSessionRedisKeys = jest
        .fn()
        .mockResolvedValue(undefined);
      gateway.clearVideoWaitTimeout = jest.fn();
      gateway.clearVideoSessionTimer = jest.fn();
      gateway.clearVideoSessionRedisKeys = jest
        .fn()
        .mockResolvedValue(undefined);

      await gateway.handleAvNoShowTimeout('booking-a', kind);

      expect(gateway.bookingsService.cancelWithRefund).toHaveBeenCalledWith(
        'booking-a',
        'Session refund — pandit timeout',
      );
      expect(emit).toHaveBeenCalledWith(
        'sessionRefunded',
        expect.objectContaining({
          reason: 'pandit_timeout',
          coinsRefunded: 151,
        }),
      );
      expect(emit).toHaveBeenCalledWith(
        kind === 'audio' ? 'audioSessionEnded' : 'videoSessionEnded',
        { bookingId: 'booking-a' },
      );
    },
  );
});
