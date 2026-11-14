import { isPanditPresent, PRESENCE_STALE_MS } from './presence-fresh';

describe('isPanditPresent', () => {
  const now = Date.parse('2026-09-30T00:00:00.000Z');

  it('is offline when the flag is on but no heartbeat exists', () => {
    expect(isPanditPresent({ isOnline: true, presenceSeenAt: null }, now)).toBe(false);
  });

  it('is offline when the last heartbeat is older than the window', () => {
    const seen = new Date(now - PRESENCE_STALE_MS - 1);
    expect(isPanditPresent({ isOnline: true, presenceSeenAt: seen }, now)).toBe(false);
  });

  it('is online inside the heartbeat window', () => {
    const seen = new Date(now - 30_000);
    expect(isPanditPresent({ isOnline: true, presenceSeenAt: seen }, now)).toBe(true);
  });

  it('is offline when the pandit toggled off', () => {
    expect(
      isPanditPresent({ isOnline: false, presenceSeenAt: new Date(now) }, now),
    ).toBe(false);
  });
});
