import type { Request } from 'express';
import { clientIp } from './client-ip.util';

function mockReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('clientIp', () => {
  it('prefers Express req.ip (trust proxy)', () => {
    expect(
      clientIp(
        mockReq({
          ip: '203.0.113.9',
          headers: { 'x-forwarded-for': '1.1.1.1, 203.0.113.9' },
          socket: { remoteAddress: '10.0.0.1' } as Request['socket'],
        }),
      ),
    ).toBe('203.0.113.9');
  });

  it('ignores spoofed X-Forwarded-For when req.ip is set', () => {
    expect(
      clientIp(
        mockReq({
          ip: '198.51.100.1',
          headers: { 'x-forwarded-for': '8.8.8.8' },
          socket: { remoteAddress: '10.0.0.1' } as Request['socket'],
        }),
      ),
    ).toBe('198.51.100.1');
  });

  it('falls back to socket remoteAddress', () => {
    expect(
      clientIp(
        mockReq({
          ip: undefined,
          headers: {},
          socket: { remoteAddress: '127.0.0.1' } as Request['socket'],
        }),
      ),
    ).toBe('127.0.0.1');
  });
});
