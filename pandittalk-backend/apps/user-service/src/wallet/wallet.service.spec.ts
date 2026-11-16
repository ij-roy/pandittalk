import { TransactionStatus } from '@prisma/client';
import { WalletService } from './wallet.service';

describe('WalletService payment recovery', () => {
  it('returns the already credited wallet result when webhook wins the verification race', async () => {
    const prisma = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          status: TransactionStatus.SUCCESS,
          coinsAmount: 301,
          razorpayPaymentId: 'pay_123',
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ walletBalance: 752 }),
      },
    };
    const config = { get: jest.fn() };
    const service = new WalletService(prisma as never, config as never);

    await expect(
      service.verifyPayment('user-1', {
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'already-verified',
      }),
    ).resolves.toEqual({
      success: true,
      coinsAdded: 301,
      newBalance: 752,
    });
  });

  it('does not treat a different payment response as a successful replay', async () => {
    const prisma = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          status: TransactionStatus.SUCCESS,
          coinsAmount: 301,
          razorpayPaymentId: 'pay_123',
        }),
      },
      user: { findFirst: jest.fn() },
    };
    const service = new WalletService(
      prisma as never,
      { get: jest.fn() } as never,
    );

    await expect(
      service.verifyPayment('user-1', {
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_other',
        razorpaySignature: 'not-used',
      }),
    ).rejects.toThrow('Payment already processed');
  });
});
