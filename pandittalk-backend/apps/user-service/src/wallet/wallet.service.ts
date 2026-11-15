import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type CoinPackage,
  type Transaction,
  TransactionStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { readFeatureFlags } from '../config/feature-flags';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { buildGstInvoice, type GstInvoice } from './gst-invoice';

export interface WalletResponse {
  coinBalance: number;
  transactions: Transaction[];
  packages: CoinPackage[];
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number | string;
  currency: 'INR';
  keyId: string;
  package: {
    label: string;
    coins: number;
    bonusCoins: number;
    priceInr: number;
  };
}

export interface VerifyPaymentResponse {
  success: true;
  coinsAdded: number;
  newBalance: number;
}

export interface WebhookResponse {
  received: true;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
}

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getWallet(userId: string): Promise<WalletResponse> {
    const [user, transactions, packages] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, isActive: true },
        select: { walletBalance: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.coinPackage.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      coinBalance: Number(user.walletBalance),
      transactions,
      packages,
    };
  }

  async getPurchaseInvoice(
    userId: string,
    transactionId: string,
  ): Promise<GstInvoice> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    if (
      transaction.type !== 'purchase' ||
      transaction.status !== TransactionStatus.SUCCESS
    ) {
      throw new BadRequestException(
        'A tax invoice is available after a successful recharge',
      );
    }
    const amountInr =
      transaction.amountInr == null
        ? Number.NaN
        : Number(transaction.amountInr);
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      throw new BadRequestException('This recharge has no payable amount');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { name: true, firstName: true, lastName: true },
    });
    const composed = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const buyerName = user?.name?.trim() || composed || 'Customer';
    const sellerGstin = this.configService.get<string>('GSTIN')?.trim() || null;
    const sellerAddress =
      this.configService.get<string>('GST_ADDRESS')?.trim() || null;
    return buildGstInvoice({
      transactionId: transaction.id,
      paidAt: transaction.createdAt,
      amountInr,
      coinsAmount: transaction.coinsAmount,
      paymentReference: transaction.razorpayPaymentId,
      buyerName,
      sellerName:
        this.configService.get<string>('GST_LEGAL_NAME')?.trim() ||
        'PanditTalk',
      sellerGstin,
      sellerAddress,
    });
  }

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<CreateOrderResponse> {
    // Option C / App Store: Razorpay coin packs fund live consultations.
    // FEATURE_PAYMENTS=false stops new checkouts without an app release.
    if (!readFeatureFlags().payments) {
      throw new ServiceUnavailableException(
        'Wallet recharge is temporarily unavailable. You will not be charged. Existing balances and transactions remain available.',
      );
    }

    const coinPackage = await this.prisma.coinPackage.findUnique({
      where: { id: dto.coinPackageId },
    });

    if (!coinPackage || !coinPackage.isActive) {
      throw new NotFoundException('Coin package not found');
    }

    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new InternalServerErrorException(
        'Payment gateway is not configured',
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receipt = `ptalk_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const amountPaise = Math.round(Number(coinPackage.priceInr) * 100);

    let order: { id: string; amount: number | string };
    try {
      order = (await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt,
      })) as { id: string; amount: number | string };
    } catch (error) {
      console.error('[Razorpay] order creation failed:', error);
      throw new InternalServerErrorException('Failed to create payment order');
    }

    const coinsAmount = coinPackage.coins + coinPackage.bonusCoins;

    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'purchase',
        status: TransactionStatus.PENDING,
        coinsAmount,
        amountInr: coinPackage.priceInr,
        razorpayOrderId: order.id,
        coinPackageId: coinPackage.id,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: 'INR',
      keyId,
      package: {
        label: coinPackage.label,
        coins: coinPackage.coins,
        bonusCoins: coinPackage.bonusCoins,
        priceInr: Number(coinPackage.priceInr),
      },
    };
  }

  async verifyPayment(
    userId: string,
    dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResponse> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      throw new BadRequestException('Payment already processed');
    }

    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keySecret) {
      throw new InternalServerErrorException(
        'Payment gateway is not configured',
      );
    }

    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expected !== dto.razorpaySignature) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED },
      });
      throw new BadRequestException('Payment verification failed');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: {
          id: transaction.id,
          status: TransactionStatus.PENDING,
        },
        data: {
          status: TransactionStatus.SUCCESS,
          razorpayPaymentId: dto.razorpayPaymentId,
        },
      });

      if (updated.count === 0) {
        return null;
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: transaction.coinsAmount },
        },
        select: { walletBalance: true },
      });
    });

    if (!result) {
      const user = await this.prisma.user.findFirst({
        where: { id: userId, isActive: true },
        select: { walletBalance: true },
      });

      return {
        success: true,
        coinsAdded: transaction.coinsAmount,
        newBalance: Number(user?.walletBalance ?? 0),
      };
    }

    return {
      success: true,
      coinsAdded: transaction.coinsAmount,
      newBalance: Number(result.walletBalance),
    };
  }

  async handleWebhook(
    rawBody: Buffer,
    razorpaySignature: string,
  ): Promise<WebhookResponse> {
    const webhookSecret = this.configService.get<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new InternalServerErrorException('Webhook is not configured');
    }

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expected !== razorpaySignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = JSON.parse(
      rawBody.toString('utf8'),
    ) as RazorpayWebhookPayload;

    if (event.event !== 'payment.captured') {
      return { received: true };
    }

    const razorpayPaymentId = event.payload?.payment?.entity?.id;
    const razorpayOrderId = event.payload?.payment?.entity?.order_id;

    if (!razorpayPaymentId || !razorpayOrderId) {
      return { received: true };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { razorpayOrderId },
    });

    if (!transaction || transaction.status === TransactionStatus.SUCCESS) {
      return { received: true };
    }

    if (transaction.status === TransactionStatus.PENDING) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.transaction.updateMany({
          where: {
            id: transaction.id,
            status: TransactionStatus.PENDING,
          },
          data: {
            status: TransactionStatus.SUCCESS,
            razorpayPaymentId,
          },
        });

        if (updated.count === 0) {
          return;
        }

        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            walletBalance: { increment: transaction.coinsAmount },
          },
        });
      });
    }

    return { received: true };
  }
}
