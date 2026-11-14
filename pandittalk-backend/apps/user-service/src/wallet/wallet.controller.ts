import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { type GstInvoice } from './gst-invoice';
import {
  WalletService,
  type CreateOrderResponse,
  type VerifyPaymentResponse,
  type WalletResponse,
  type WebhookResponse,
} from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getWallet(@CurrentUser('sub') userId: string): Promise<WalletResponse> {
    return this.walletService.getWallet(userId);
  }

  @Get('transactions/:id/invoice')
  @UseGuards(JwtAuthGuard)
  getPurchaseInvoice(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GstInvoice> {
    return this.walletService.getPurchaseInvoice(userId, id);
  }

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<CreateOrderResponse> {
    return this.walletService.createOrder(userId, dto);
  }

  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  verifyPayment(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResponse> {
    return this.walletService.verifyPayment(userId, dto);
  }

  @Post('webhook')
  async webhook(@Req() req: Request): Promise<WebhookResponse> {
    const rawBody = req.body as Buffer;
    const header = req.headers['x-razorpay-signature'];
    const signature = Array.isArray(header) ? header[0] : header;

    await this.walletService.handleWebhook(rawBody, signature ?? '');
    return { received: true };
  }
}
