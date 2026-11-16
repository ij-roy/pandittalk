import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import {
  BOOKING_CATALOG,
  calculateBookingQuote,
  chatNowQuote,
  type BookingDepth,
  type BookingFormat,
} from './booking-catalog';

@Controller('booking-catalog')
export class BookingCatalogController {
  @Get()
  getCatalog() {
    return BOOKING_CATALOG;
  }

  @Get('quote')
  getQuote(
    @Query('depth') depth?: string,
    @Query('format') format?: string,
    @Query('mode') mode?: string,
  ) {
    if (mode === 'chat-now') return chatNowQuote();
    if (!depth || !format) {
      throw new BadRequestException('depth and format are required');
    }
    try {
      return calculateBookingQuote(
        depth as BookingDepth,
        format as BookingFormat,
      );
    } catch {
      throw new BadRequestException('Unsupported booking option');
    }
  }
}
