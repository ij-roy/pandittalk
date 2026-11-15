import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { AdminQueryDto } from './dto/admin-query.dto';
import { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';
import { UpdateAdminApplicationDto } from './dto/update-admin-application.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  users(@Query() query: AdminQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('pandits')
  pandits(@Query() query: AdminQueryDto) {
    return this.adminService.listPandits(query);
  }

  @Get('bookings')
  bookings(@Query() query: AdminQueryDto) {
    return this.adminService.listBookings(query);
  }

  @Patch('bookings/:bookingId/status')
  updateBookingStatus(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: UpdateAdminBookingDto,
  ) {
    return this.adminService.updateBookingStatus(bookingId, dto.status);
  }

  @Get('applications')
  applications(@Query() query: AdminQueryDto) {
    return this.adminService.listApplications(query);
  }

  @Patch('applications/:applicationId/status')
  updateApplicationStatus(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateAdminApplicationDto,
  ) {
    return this.adminService.updateApplicationStatus(applicationId, dto.status);
  }

  @Get('articles')
  articles(@Query() query: AdminQueryDto) {
    return this.adminService.listArticles(query);
  }

  @Get('notifications')
  notifications(@Query() query: AdminQueryDto) {
    return this.adminService.listNotifications(query);
  }

  @Get('transactions')
  transactions(@Query() query: AdminQueryDto) {
    return this.adminService.listTransactions(query);
  }

  @Get('reports')
  reports(@Query() query: AdminQueryDto) {
    return this.adminService.listReports(query);
  }
}
