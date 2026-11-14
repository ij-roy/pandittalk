import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OtpSmsProvider } from './otp-sms.provider';

type Msg91Response = {
  type?: string;
  message?: string;
};

@Injectable()
export class Msg91OtpSmsProvider implements OtpSmsProvider {
  private readonly logger = new Logger(Msg91OtpSmsProvider.name);
  private readonly authKey: string;
  private readonly templateId: string;
  private readonly senderId: string | undefined;

  constructor(config: ConfigService) {
    this.authKey = config.get<string>('MSG91_AUTH_KEY', '');
    this.templateId = config.get<string>('MSG91_TEMPLATE_ID', '');
    this.senderId = config.get<string>('MSG91_SENDER_ID') || undefined;
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    const mobile = phoneNumber.replace(/^\+/, '');
    const params = new URLSearchParams({
      template_id: this.templateId,
      mobile,
      authkey: this.authKey,
      otp,
    });
    if (this.senderId) {
      params.set('sender', this.senderId);
    }

    const url = `https://control.msg91.com/api/v5/otp?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(url, { method: 'POST' });
    } catch (err) {
      this.logger.error('MSG91 OTP request failed', err);
      throw new ServiceUnavailableException(
        'Unable to send OTP at this time. Please try again later.',
      );
    }

    let body: Msg91Response;
    try {
      body = (await response.json()) as Msg91Response;
    } catch {
      this.logger.error(`MSG91 OTP non-JSON response: HTTP ${response.status}`);
      throw new ServiceUnavailableException(
        'Unable to send OTP at this time. Please try again later.',
      );
    }

    if (!response.ok || body.type !== 'success') {
      this.logger.error(
        `MSG91 OTP failed: HTTP ${response.status} type=${body.type} message=${body.message ?? ''}`,
      );
      throw new ServiceUnavailableException(
        'Unable to send OTP at this time. Please try again later.',
      );
    }
  }
}
