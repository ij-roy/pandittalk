import { Injectable } from '@nestjs/common';
import type { OtpSmsProvider } from './otp-sms.provider';

@Injectable()
export class ConsoleOtpSmsProvider implements OtpSmsProvider {
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    console.log(
      '\n🌟 [DEV ONLY] Generated OTP for ' + phoneNumber + ': ' + otp + '\n',
    );
  }
}
