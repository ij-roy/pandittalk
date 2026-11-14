import { Injectable } from '@nestjs/common';
import { RedisClientService } from '../redis/redis-client.service';
import { OtpRateLimitException } from './exceptions/otp-rate-limit.exception';

const PHONE_WINDOW_SEC = 10 * 60;
const PHONE_MAX_REQUESTS = 3;
const COOLDOWN_SEC = 60;
const IP_WINDOW_SEC = 60 * 60;
const IP_MAX_REQUESTS = 10;

const VERIFY_PHONE_WINDOW_SEC = 10 * 60;
const VERIFY_PHONE_MAX = 10;
const VERIFY_IP_WINDOW_SEC = 60 * 60;
const VERIFY_IP_MAX = 30;

/** Lua: atomic SMS quota reserve (cooldown + phone + IP). Returns {code, ttl}. */
const RESERVE_SEND_LUA = `
local cooldownTtl = redis.call('TTL', KEYS[1])
if redis.call('EXISTS', KEYS[1]) == 1 then
  if cooldownTtl < 0 then cooldownTtl = tonumber(ARGV[5]) end
  return {1, cooldownTtl}
end

local phoneCount = tonumber(redis.call('GET', KEYS[2]) or '0')
if phoneCount >= tonumber(ARGV[1]) then
  local ttl = redis.call('TTL', KEYS[2])
  if ttl < 0 then ttl = tonumber(ARGV[2]) end
  return {2, ttl}
end

local ipCount = tonumber(redis.call('GET', KEYS[3]) or '0')
if ipCount >= tonumber(ARGV[3]) then
  local ttl = redis.call('TTL', KEYS[3])
  if ttl < 0 then ttl = tonumber(ARGV[4]) end
  return {3, ttl}
end

local pc = redis.call('INCR', KEYS[2])
if pc == 1 then
  redis.call('EXPIRE', KEYS[2], tonumber(ARGV[2]))
end
local ic = redis.call('INCR', KEYS[3])
if ic == 1 then
  redis.call('EXPIRE', KEYS[3], tonumber(ARGV[4]))
end
redis.call('SET', KEYS[1], '1', 'EX', tonumber(ARGV[5]))
return {0, 0}
`;

/** Lua: release a reserved send (best-effort DECR + clear cooldown). */
const RELEASE_SEND_LUA = `
if redis.call('EXISTS', KEYS[1]) == 1 then
  redis.call('DEL', KEYS[1])
end
local function decrFloor(key)
  if redis.call('EXISTS', key) == 0 then
    return
  end
  local n = redis.call('DECR', key)
  if n <= 0 then
    redis.call('DEL', key)
  end
end
decrFloor(KEYS[2])
decrFloor(KEYS[3])
return 1
`;

/** Lua: atomic verify throttle (phone + IP). Returns {code, ttl}. */
const RESERVE_VERIFY_LUA = `
local phoneCount = tonumber(redis.call('GET', KEYS[1]) or '0')
if phoneCount >= tonumber(ARGV[1]) then
  local ttl = redis.call('TTL', KEYS[1])
  if ttl < 0 then ttl = tonumber(ARGV[2]) end
  return {1, ttl}
end
local ipCount = tonumber(redis.call('GET', KEYS[2]) or '0')
if ipCount >= tonumber(ARGV[3]) then
  local ttl = redis.call('TTL', KEYS[2])
  if ttl < 0 then ttl = tonumber(ARGV[4]) end
  return {2, ttl}
end
local pc = redis.call('INCR', KEYS[1])
if pc == 1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
end
local ic = redis.call('INCR', KEYS[2])
if ic == 1 then
  redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4]))
end
return {0, 0}
`;

@Injectable()
export class OtpRateLimitService {
  constructor(private readonly redis: RedisClientService) {}

  private phoneKey(phoneNumber: string): string {
    return `otp:rl:phone:${phoneNumber}`;
  }

  private cooldownKey(phoneNumber: string): string {
    return `otp:cooldown:phone:${phoneNumber}`;
  }

  private ipKey(ip: string): string {
    return `otp:rl:ip:${ip}`;
  }

  private verifyPhoneKey(phoneNumber: string): string {
    return `otp:rl:verify:phone:${phoneNumber}`;
  }

  private verifyIpKey(ip: string): string {
    return `otp:rl:verify:ip:${ip}`;
  }

  /**
   * Atomically reserve one SMS send against phone + IP + cooldown.
   * Call before sending SMS; on send failure call {@link releaseReservation}.
   */
  async reserveSend(phoneNumber: string, clientIp: string): Promise<void> {
    const result = await this.redis.eval<[number, number]>(
      RESERVE_SEND_LUA,
      [
        this.cooldownKey(phoneNumber),
        this.phoneKey(phoneNumber),
        this.ipKey(clientIp),
      ],
      [
        PHONE_MAX_REQUESTS,
        PHONE_WINDOW_SEC,
        IP_MAX_REQUESTS,
        IP_WINDOW_SEC,
        COOLDOWN_SEC,
      ],
    );

    const code = Number(result[0]);
    const ttl = Number(result[1]);
    if (code === 0) {
      return;
    }
    if (code === 1) {
      throw new OtpRateLimitException(ttl > 0 ? ttl : COOLDOWN_SEC);
    }
    if (code === 2) {
      throw new OtpRateLimitException(ttl > 0 ? ttl : PHONE_WINDOW_SEC);
    }
    throw new OtpRateLimitException(ttl > 0 ? ttl : IP_WINDOW_SEC);
  }

  /** Undo a successful {@link reserveSend} when SMS/store fails after reserve. */
  async releaseReservation(
    phoneNumber: string,
    clientIp: string,
  ): Promise<void> {
    await this.redis.eval(
      RELEASE_SEND_LUA,
      [
        this.cooldownKey(phoneNumber),
        this.phoneKey(phoneNumber),
        this.ipKey(clientIp),
      ],
      [],
    );
  }

  /**
   * Atomically count a verify-otp attempt (phone + IP).
   * Limits parallel brute-force sprays against an outstanding OTP.
   */
  async assertVerifyAllowed(
    phoneNumber: string,
    clientIp: string,
  ): Promise<void> {
    const result = await this.redis.eval<[number, number]>(
      RESERVE_VERIFY_LUA,
      [this.verifyPhoneKey(phoneNumber), this.verifyIpKey(clientIp)],
      [
        VERIFY_PHONE_MAX,
        VERIFY_PHONE_WINDOW_SEC,
        VERIFY_IP_MAX,
        VERIFY_IP_WINDOW_SEC,
      ],
    );

    const code = Number(result[0]);
    const ttl = Number(result[1]);
    if (code === 0) {
      return;
    }
    if (code === 1) {
      throw new OtpRateLimitException(ttl > 0 ? ttl : VERIFY_PHONE_WINDOW_SEC);
    }
    throw new OtpRateLimitException(ttl > 0 ? ttl : VERIFY_IP_WINDOW_SEC);
  }
}
