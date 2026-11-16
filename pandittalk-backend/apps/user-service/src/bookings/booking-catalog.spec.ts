import {
  BOOKING_CATALOG,
  calculateBookingQuote,
  type BookingDepth,
  type BookingFormat,
} from './booking-catalog';

describe('booking catalog', () => {
  it('publishes the timed scheduled offers used by booking creation', () => {
    expect(BOOKING_CATALOG.scheduled.depths).toEqual([
      { key: 'entry', label: 'Entry', durationMinutes: 15, basePrice: 151 },
      {
        key: 'standard',
        label: 'Standard',
        durationMinutes: 25,
        basePrice: 301,
      },
      { key: 'deep', label: 'Deep', durationMinutes: 45, basePrice: 501 },
    ]);
    expect(BOOKING_CATALOG.scheduled.formats).toEqual([
      { key: 'chat', label: 'Chat', surcharge: -50 },
      { key: 'audio', label: 'Audio', surcharge: 0 },
      { key: 'video', label: 'Video', surcharge: 150 },
    ]);
  });

  it.each([
    ['entry', 'chat', 15, 101],
    ['entry', 'audio', 15, 151],
    ['entry', 'video', 15, 301],
    ['standard', 'chat', 25, 251],
    ['standard', 'audio', 25, 301],
    ['standard', 'video', 25, 451],
    ['deep', 'chat', 45, 451],
    ['deep', 'audio', 45, 501],
    ['deep', 'video', 45, 651],
  ])(
    'quotes %s/%s as %s minutes and %s coins',
    (depth, format, durationMinutes, totalPrice) => {
      expect(
        calculateBookingQuote(depth as BookingDepth, format as BookingFormat),
      ).toMatchObject({
        sessionModel: 'legacy_timed',
        depth,
        format,
        durationMinutes,
        totalPrice,
        coinsDeducted: totalPrice,
      });
    },
  );

  it('publishes Chat Now queue and refund rules', () => {
    expect(BOOKING_CATALOG.chatNow).toMatchObject({
      enabled: true,
      durationMinutes: 15,
      totalPrice: 101,
      noShowRefundMinutes: 10,
      maxQueueDepth: 5,
      maxQueueWaitMinutes: 15,
      queueTurnTimeoutSeconds: 60,
    });
  });

  it('rejects unsupported quote values instead of guessing', () => {
    expect(() =>
      calculateBookingQuote('unknown' as BookingDepth, 'audio'),
    ).toThrow('Unsupported booking option');
    expect(() =>
      calculateBookingQuote('entry', 'unknown' as BookingFormat),
    ).toThrow('Unsupported booking option');
  });
});
