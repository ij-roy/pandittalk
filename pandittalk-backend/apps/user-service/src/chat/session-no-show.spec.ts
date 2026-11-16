import {
  scheduledNoShowDelayMs,
  shouldRefundScheduledNoShow,
} from './session-no-show';

describe('scheduled audio/video no-show policy', () => {
  const startTime = new Date('2026-11-16T10:00:00.000Z');

  it('waits until the catalogue no-show window after the scheduled start', () => {
    expect(
      scheduledNoShowDelayMs(
        startTime,
        new Date('2026-11-16T10:05:00.000Z'),
        10,
      ),
    ).toBe(5 * 60 * 1000);
    expect(
      scheduledNoShowDelayMs(
        startTime,
        new Date('2026-11-16T10:11:00.000Z'),
        10,
      ),
    ).toBe(0);
  });

  it('refunds only when one participant is still waiting after the window', () => {
    expect(
      shouldRefundScheduledNoShow({
        startTime,
        now: new Date('2026-11-16T10:10:00.000Z'),
        noShowMinutes: 10,
        sessionStarted: false,
        participantCount: 1,
      }),
    ).toBe(true);
    expect(
      shouldRefundScheduledNoShow({
        startTime,
        now: new Date('2026-11-16T10:10:00.000Z'),
        noShowMinutes: 10,
        sessionStarted: false,
        participantCount: 2,
      }),
    ).toBe(false);
    expect(
      shouldRefundScheduledNoShow({
        startTime,
        now: new Date('2026-11-16T10:10:00.000Z'),
        noShowMinutes: 10,
        sessionStarted: true,
        participantCount: 1,
      }),
    ).toBe(false);
  });
});
