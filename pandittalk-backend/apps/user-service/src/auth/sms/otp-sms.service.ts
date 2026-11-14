import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleOtpSmsProvider } from './console-otp-sms.provider';
import { Msg91OtpSmsProvider } from './msg91-otp-sms.provider';
import type { OtpSmsProvider } from './otp-sms.provider';

@Injectable()
export class OtpSmsService implements OtpSmsProvider {
  private readonly logger = new Logger(OtpSmsService.name);
  private readonly provider: OtpSmsProvider;

  constructor(
    config: ConfigService,
    consoleProvider: ConsoleOtpSmsProvider,
    msg91Provider: Msg91OtpSmsProvider,
  ) {
    const smsProvider = config.get<string>('OTP_SMS_PROVIDER', 'none');
    const authKey = config.get<string>('MSG91_AUTH_KEY', '');
    const templateId = config.get<string>('MSG91_TEMPLATE_ID', '');

    if (smsProvider === 'msg91') {
      if (!authKey || !templateId) {
        throw new Error(
          'OTP_SMS_PROVIDER=msg91 requires MSG91_AUTH_KEY and MSG91_TEMPLATE_ID',
        );
      }
      this.provider = msg91Provider;
      this.logger.log('OTP SMS provider: MSG91');
    } else {
      this.provider = consoleProvider;
    }
  }

  sendOtp(phoneNumber: string, otp: string): Promise<void> {
    return this.provider.sendOtp(phoneNumber, otp);
  }
}
