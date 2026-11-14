import { HttpException, HttpStatus } from '@nestjs/common';

export class OtpRateLimitException extends HttpException {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many OTP requests. Please try again later.',
        retryAfterSeconds: seconds,
        code: 'OTP_RATE_LIMITED',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
    this.retryAfterSeconds = seconds;
  }
}
