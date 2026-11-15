import { AudioSessionController } from './audio-session.controller';
import { VideoSessionController } from './video-session.controller';

const createBooking = (overrides: Record<string, unknown> = {}) => ({
  id: 'booking-1',
  userId: 'user-1',
  status: 'confirmed',
  format: 'video',
  startTime: new Date(Date.now() - 60_000),
  endTime: new Date(Date.now() + 60 * 60_000),
  pandit: { userId: 'pandit-1' },
  ...overrides,
});

const createDependencies = (booking: Record<string, unknown>) => {
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking),
    },
  };
  const webRtcService = {
    getSessionConfig: jest.fn().mockResolvedValue({
      provider: 'webrtc',
      bookingId: 'booking-1',
      format: 'video',
      iceServers: [{ urls: 'stun:stun.example.com' }],
    }),
  };

  return { prisma, webRtcService };
};

describe('WebRTC session GET eligibility', () => {
  it('does not issue video ICE credentials for a non-video booking', async () => {
    const { prisma, webRtcService } = createDependencies(
      createBooking({ format: 'audio' }),
    );
    const controller = new VideoSessionController(
      prisma as never,
      webRtcService as never,
    );

    await expect(controller.getSession('user-1', 'booking-1')).rejects.toThrow(
      'Booking format must be video',
    );
    expect(webRtcService.getSessionConfig).not.toHaveBeenCalled();
  });

  it('does not issue audio ICE credentials for a cancelled booking', async () => {
    const { prisma, webRtcService } = createDependencies(
      createBooking({ format: 'audio', status: 'cancelled' }),
    );
    const controller = new AudioSessionController(
      prisma as never,
      webRtcService as never,
    );

    await expect(controller.getSession('user-1', 'booking-1')).rejects.toThrow(
      'Booking status must be confirmed',
    );
    expect(webRtcService.getSessionConfig).not.toHaveBeenCalled();
  });

  it('issues session configuration for a confirmed booking inside its session window', async () => {
    const booking = createBooking();
    const { prisma, webRtcService } = createDependencies(booking);
    const controller = new VideoSessionController(
      prisma as never,
      webRtcService as never,
    );

    await expect(
      controller.getSession('user-1', 'booking-1'),
    ).resolves.toMatchObject({
      provider: 'webrtc',
      bookingId: 'booking-1',
      format: 'video',
    });
    expect(webRtcService.getSessionConfig).toHaveBeenCalledWith(
      'booking-1',
      'video',
    );
  });
});
