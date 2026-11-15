import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { WebRtcService } from './webrtc.service';

describe('WebRtcService Cloudflare TURN integration', () => {
  const values: Record<string, string | undefined> = {};
  let fetchMock: jest.SpyInstance;

  const createService = () => {
    const config = {
      get: jest.fn(
        (key: string, defaultValue?: unknown) => values[key] ?? defaultValue,
      ),
    } as unknown as ConfigService;

    return new WebRtcService(config);
  };

  beforeEach(() => {
    Object.keys(values).forEach((key) => delete values[key]);
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.useRealTimers();
    fetchMock.mockRestore();
  });

  it('requests and returns Cloudflare ICE servers with the default TTL', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    const cloudflareIceServers = [
      { urls: 'stun:stun.cloudflare.com:3478' },
      {
        urls: [
          'stun:stun.cloudflare.com:3478',
          'turn:turn.cloudflare.com:3478',
        ],
        username: 'ephemeral-user',
        credential: 'ephemeral-credential',
      },
    ];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: cloudflareIceServers }),
    } as Response);

    const result = await createService().getSessionConfig('booking-1', 'video');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://rtc.live.cloudflare.com/v1/turn/keys/key-123/credentials/generate-ice-servers',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer api-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: 86400 }),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toEqual({
      provider: 'webrtc',
      bookingId: 'booking-1',
      format: 'video',
      iceServers: cloudflareIceServers,
    });
  });

  it('uses the configured TTL when it is a positive number', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    values.CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS = '3600';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        iceServers: [
          {
            urls: 'turn:turn.cloudflare.com',
            username: 'user',
            credential: 'credential',
          },
        ],
      }),
    } as Response);

    await createService().getSessionConfig('booking-1', 'audio');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ ttl: 3600 }) }),
    );
  });

  it.each(['0', '-1', '0.5', '172801', 'not-a-number'])(
    'uses the default TTL when the configured TTL is invalid: %s',
    async (configuredTtl) => {
      values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
      values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
      values.CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS = configuredTtl;
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          iceServers: [
            {
              urls: 'turn:turn.cloudflare.com',
              username: 'user',
              credential: 'credential',
            },
          ],
        }),
      } as Response);

      await createService().getSessionConfig('booking-1', 'audio');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify({ ttl: 86400 }) }),
      );
    },
  );

  it('uses static TURN without calling Cloudflare when Cloudflare is not configured', async () => {
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';
    values.WEBRTC_TURN_URL = 'turn:turn.example.com';
    values.WEBRTC_TURN_USERNAME = 'static-user';
    values.WEBRTC_TURN_CREDENTIAL = 'static-credential';

    const result = await createService().getSessionConfig('booking-1', 'audio');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.iceServers).toEqual([
      { urls: 'stun:stun.example.com' },
      {
        urls: 'turn:turn.example.com',
        username: 'static-user',
        credential: 'static-credential',
      },
    ]);
  });

  it('does not call Cloudflare when only one Cloudflare credential is configured', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';

    const result = await createService().getSessionConfig('booking-1', 'audio');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.iceServers).toEqual([{ urls: 'stun:stun.example.com' }]);
  });

  it('falls back to static TURN when Cloudflare returns an error or invalid ICE data', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';
    values.WEBRTC_TURN_URL = 'turn:turn.example.com';
    values.WEBRTC_TURN_USERNAME = 'static-user';
    values.WEBRTC_TURN_CREDENTIAL = 'static-credential';
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ iceServers: [{ username: 'missing-urls' }] }),
      } as Response);

    const service = createService();
    const firstResult = await service.getSessionConfig('booking-1', 'audio');
    const secondResult = await service.getSessionConfig('booking-2', 'audio');

    expect(firstResult.iceServers).toHaveLength(2);
    expect(secondResult.iceServers).toHaveLength(2);
    expect(secondResult.iceServers[1]).toEqual({
      urls: 'turn:turn.example.com',
      username: 'static-user',
      credential: 'static-credential',
    });
  });

  it('rejects malformed Cloudflare TURN data and uses static TURN fallback', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';
    values.WEBRTC_TURN_URL = 'turn:turn.example.com';
    values.WEBRTC_TURN_USERNAME = 'static-user';
    values.WEBRTC_TURN_CREDENTIAL = 'static-credential';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        iceServers: [{ urls: 'https://not-an-ice-server' }],
      }),
    } as Response);

    const result = await createService().getSessionConfig('booking-1', 'audio');

    expect(result.iceServers).toEqual([
      { urls: 'stun:stun.example.com' },
      {
        urls: 'turn:turn.example.com',
        username: 'static-user',
        credential: 'static-credential',
      },
    ]);
  });

  it('rejects TURN data without credentials and does not log secrets', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';
    const warnMock = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        iceServers: [{ urls: 'turn:turn.cloudflare.com' }],
      }),
    } as Response);

    const result = await createService().getSessionConfig('booking-1', 'audio');

    expect(result.iceServers).toEqual([{ urls: 'stun:stun.example.com' }]);
    expect(warnMock.mock.calls.flat().join(' ')).not.toContain('api-token');
    warnMock.mockRestore();
  });

  it('falls back after a Cloudflare request aborts at the timeout', async () => {
    jest.useFakeTimers();
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';
    fetchMock.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('request aborted')),
          );
        }),
    );

    const resultPromise = createService().getSessionConfig(
      'booking-1',
      'audio',
    );
    jest.advanceTimersByTime(5000);

    await expect(resultPromise).resolves.toMatchObject({
      iceServers: [{ urls: 'stun:stun.example.com' }],
    });
  });

  it('falls back to STUN-only when Cloudflare fails and static TURN is incomplete', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';
    values.WEBRTC_TURN_URL = 'turn:turn.example.com';
    fetchMock.mockRejectedValue(new Error('Cloudflare unavailable'));

    const result = await createService().getSessionConfig('booking-1', 'audio');

    expect(result.iceServers).toEqual([{ urls: 'stun:stun.example.com' }]);
  });

  it('falls back after Cloudflare returns malformed JSON', async () => {
    values.CLOUDFLARE_TURN_KEY_ID = 'key-123';
    values.CLOUDFLARE_TURN_API_TOKEN = 'api-token';
    values.WEBRTC_STUN_URLS = 'stun:stun.example.com';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('invalid JSON');
      },
    } as Response);

    const result = await createService().getSessionConfig('booking-1', 'audio');

    expect(result.iceServers).toEqual([{ urls: 'stun:stun.example.com' }]);
  });
});
