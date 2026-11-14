import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerContractsService } from './customer-contracts.service';
import { CreateContextDto, ShareContextDto, UpdateContextDto, RevokeContextDto, NotificationPreferencesDto, PhoneChangeRequestDto, PhoneChangeVerifyDto, SupportRequestDto, BlockPanditDto, PanditApplicationDto, CreateFamilyMemberDto } from './dto';

@Controller('users')
export class CustomerContractsController {
  constructor(private readonly service: CustomerContractsService) {}

  @Get('contexts') @UseGuards(JwtAuthGuard)
  listContexts(@CurrentUser('sub') userId: string) { return this.service.listContexts(userId); }
  @Post('contexts') @UseGuards(JwtAuthGuard)
  createContext(@CurrentUser('sub') userId: string, @Body() dto: CreateContextDto) { return this.service.createContext(userId, dto.text); }
  @Patch('contexts/:id') @UseGuards(JwtAuthGuard)
  updateContext(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContextDto) { return this.service.updateContext(userId, id, dto.text); }
  @Delete('contexts/:id') @UseGuards(JwtAuthGuard)
  deleteContext(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.deleteContext(userId, id); }
  @Post('contexts/:id/share') @UseGuards(JwtAuthGuard)
  shareContext(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ShareContextDto) { return this.service.shareContext(userId, id, dto); }
  @Delete('contexts/:id/share/:bookingId') @UseGuards(JwtAuthGuard)
  revokeContext(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Param('bookingId', ParseUUIDPipe) bookingId: string, @Body() dto: RevokeContextDto) { return this.service.revokeContext(userId, id, bookingId, dto); }

  @Get('notification-preferences') @UseGuards(JwtAuthGuard)
  getPreferences(@CurrentUser('sub') userId: string) { return this.service.getPreferences(userId); }
  @Patch('notification-preferences') @UseGuards(JwtAuthGuard)
  setPreferences(@CurrentUser('sub') userId: string, @Body() dto: NotificationPreferencesDto) { return this.service.setPreferences(userId, dto); }

  @Post('phone-change/request') @UseGuards(JwtAuthGuard)
  requestPhoneChange(@CurrentUser('sub') userId: string, @Body() dto: PhoneChangeRequestDto) { return this.service.requestPhoneChange(userId, dto.phoneNumber); }
  @Post('phone-change/verify') @UseGuards(JwtAuthGuard)
  verifyPhoneChange(@CurrentUser('sub') userId: string, @Body() dto: PhoneChangeVerifyDto) { return this.service.verifyPhoneChange(userId, dto.challengeId, dto.otp); }

  @Get('blocks') @UseGuards(JwtAuthGuard)
  listBlocks(@CurrentUser('sub') userId: string) { return this.service.listPanditBlocks(userId); }
  @Post('blocks') @UseGuards(JwtAuthGuard)
  createBlock(@CurrentUser('sub') userId: string, @Body() dto: BlockPanditDto) { return this.service.blockPandit(userId, dto.panditId); }
  @Delete('blocks/:panditId') @UseGuards(JwtAuthGuard)
  removeBlock(@CurrentUser('sub') userId: string, @Param('panditId', ParseUUIDPipe) panditId: string) { return this.service.unblockPandit(userId, panditId); }

  @Get('family-members') @UseGuards(JwtAuthGuard)
  listFamily(@CurrentUser('sub') userId: string) { return this.service.listFamilyMembers(userId); }
  @Post('family-members') @UseGuards(JwtAuthGuard)
  createFamily(@CurrentUser('sub') userId: string, @Body() dto: CreateFamilyMemberDto) { return this.service.createFamilyMember(userId, dto); }
  @Delete('family-members/:id') @UseGuards(JwtAuthGuard)
  deleteFamily(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.deleteFamilyMember(userId, id); }
}

@Controller('support')
export class SupportController {
  constructor(private readonly service: CustomerContractsService) {}
  @Post('requests') @UseGuards(JwtAuthGuard)
  create(@CurrentUser('sub') userId: string, @Body() dto: SupportRequestDto) { return this.service.createSupportRequest(userId, dto); }
}

@Controller('pandit-applications')
export class PanditApplicationsController {
  constructor(private readonly service: CustomerContractsService) {}
  @Post() create(@Body() dto: PanditApplicationDto) { return this.service.createPanditApplication(dto); }
}
