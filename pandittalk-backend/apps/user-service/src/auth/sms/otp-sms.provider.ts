export interface OtpSmsProvider {
  sendOtp(phoneNumber: string, otp: string): Promise<void>;
}
