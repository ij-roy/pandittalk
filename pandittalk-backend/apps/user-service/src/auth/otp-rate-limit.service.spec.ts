import { Test } from '@nestjs/testing';
import { RedisClientService } from '../redis/redis-client.service';
import { OtpRateLimitException } from './exceptions/otp-rate-limit.exception';
import { OtpRateLimitService } from './otp-rate-limit.service';

describe('OtpRateLimitService', () => {
  let service: OtpRateLimitService;
  let redis: { eval: jest.Mock };

  beforeEach(async () => {
    redis = { eval: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        OtpRateLimitService,
        { provide: RedisClientService, useValue: redis },
      ],
    }).compile();
    service = module.get(OtpRateLimitService);
  });

  describe('reserveSend', () => {
    it('allows when Lua returns code 0', async () => {
      redis.eval.mockResolvedValue([0, 0]);
      await expect(
        service.reserveSend('+919876543210', '203.0.113.1'),
      ).resolves.toBeUndefined();
    });

    it('throws on phone limit', async () => {
      redis.eval.mockResolvedValue([2, 120]);
      await expect(
        service.reserveSend('+919876543210', '203.0.113.1'),
      ).rejects.toBeInstanceOf(OtpRateLimitException);
    });
  });

  describe('assertVerifyAllowed', () => {
    it('allows when under limit', async () => {
      redis.eval.mockResolvedValue([0, 0]);
      await expect(
        service.assertVerifyAllowed('+919876543210', '203.0.113.1'),
      ).resolves.toBeUndefined();
    });

    it('throws when verify phone bucket is full', async () => {
      redis.eval.mockResolvedValue([1, 60]);
      await expect(
        service.assertVerifyAllowed('+919876543210', '203.0.113.1'),
      ).rejects.toBeInstanceOf(OtpRateLimitException);
    });
  });

  it('releaseReservation runs release Lua', async () => {
    redis.eval.mockResolvedValue(1);
    await service.releaseReservation('+919876543210', '203.0.113.1');
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('DECR'),
      expect.arrayContaining([
        'otp:cooldown:phone:+919876543210',
        'otp:rl:phone:+919876543210',
        'otp:rl:ip:203.0.113.1',
      ]),
      [],
    );
  });
});
