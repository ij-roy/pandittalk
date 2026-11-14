/**
 * Shared domain shape for a PanditTalk user record (aligned with Prisma `User` in user-service).
 * Use `walletBalance` as a decimal string at API boundaries where JSON cannot carry Decimal.
 */
export interface User {
  id: string;
  phoneNumber: string;
  name: string | null;
  walletBalance: string;
  createdAt: Date;
}
