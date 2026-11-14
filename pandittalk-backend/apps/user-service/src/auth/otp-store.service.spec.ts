import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RedisClientService } from '../redis/redis-client.service';
import { hashOtp } from './otp-crypto.util';
import { MAX_VERIFY_ATTEMPTS, OtpStoreService } from './otp-store.service';

describe('OtpStoreService', () => {
  const secret = 'test-jwt-secret';
  let store: OtpStoreService;
  let redis: {
    set: jest.Mock;
    eval: jest.Mock;
  };

  beforeEach(async () => {
    redis = {
      set: jest.fn().mockResolvedValue(undefined),
      eval: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        OtpStoreService,
        { provide: RedisClientService, useValue: redis },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'JWT_SECRET' ? secret : undefined),
          },
        },
      ],
    }).compile();

    store = module.get(OtpStoreService);
  });

  it('saves hashed OTP JSON with TTL', async () => {
    await store.save('+919876543210', '1234');

    expect(redis.set).toHaveBeenCalledWith(
      'otp:+919876543210',
      expect.stringContaining(hashOtp('1234', secret)),
      expect.any(Number),
    );
  });

  it('verifyAndConsume returns true when Lua returns 1', async () => {
    redis.eval.mockResolvedValue(1);
    await expect(store.verifyAndConsume('+919876543210', '5678')).resolves.toBe(
      true,
    );
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('cjson.decode'),
      ['otp:+919876543210'],
      [hashOtp('5678', secret), expect.any(Number), MAX_VERIFY_ATTEMPTS],
    );
  });

  it('verifyAndConsume returns false when Lua returns 0', async () => {
    redis.eval.mockResolvedValue(0);
    await expect(store.verifyAndConsume('+919876543210', '0000')).resolves.toBe(
      false,
    );
  });
});
