import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientService } from '../redis/redis-client.service';
import { hashOtp } from './otp-crypto.util';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const MAX_VERIFY_ATTEMPTS = 5;

export type OtpRecord = {
  hash: string;
  attempts: number;
  expiresAt: number;
};

/**
 * Atomic verify/consume in Redis (Lua): read + compare + incr/delete in one step.
 * Avoids parallel wrong-OTP requests under-counting attempts.
 */
const VERIFY_AND_CONSUME_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then
  return 0
end

local ok, record = pcall(cjson.decode, raw)
if not ok or type(record) ~= 'table' then
  redis.call('DEL', KEYS[1])
  return 0
end

local expiresAt = tonumber(record['expiresAt'])
local nowMs = tonumber(ARGV[2])
if not expiresAt or expiresAt <= nowMs then
  redis.call('DEL', KEYS[1])
  return 0
end

if tostring(record['hash']) == tostring(ARGV[1]) then
  redis.call('DEL', KEYS[1])
  return 1
end

local attempts = tonumber(record['attempts']) or 0
attempts = attempts + 1
local maxAttempts = tonumber(ARGV[3])
if attempts >= maxAttempts then
  redis.call('DEL', KEYS[1])
  return 0
end

record['attempts'] = attempts
local remainingMs = expiresAt - nowMs
if remainingMs < 1000 then
  remainingMs = 1000
end
redis.call('SET', KEYS[1], cjson.encode(record), 'PX', remainingMs)
return 0
`;

@Injectable()
export class OtpStoreService {
  private readonly hashSecret: string;

  constructor(
    private readonly redis: RedisClientService,
    config: ConfigService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.hashSecret = secret;
  }

  private otpKey(phoneNumber: string): string {
    return `otp:${phoneNumber}`;
  }

  async save(phoneNumber: string, plainOtp: string): Promise<void> {
    const record: OtpRecord = {
      hash: hashOtp(plainOtp, this.hashSecret),
      attempts: 0,
      expiresAt: Date.now() + OTP_TTL_MS,
    };
    await this.redis.set(
      this.otpKey(phoneNumber),
      JSON.stringify(record),
      OTP_TTL_MS,
    );
  }

  /**
   * Returns true when OTP matches and the record is consumed.
   * Returns false on missing, expired, wrong, or locked-out OTP.
   * Attempt increments are atomic under concurrency.
   */
  async verifyAndConsume(
    phoneNumber: string,
    plainOtp: string,
  ): Promise<boolean> {
    const inputHash = hashOtp(plainOtp, this.hashSecret);
    const result = await this.redis.eval<number>(
      VERIFY_AND_CONSUME_LUA,
      [this.otpKey(phoneNumber)],
      [inputHash, Date.now(), MAX_VERIFY_ATTEMPTS],
    );
    return Number(result) === 1;
  }
}
