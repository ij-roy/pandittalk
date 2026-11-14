import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { parseClientPlatform } from '../common/client-platform';
import { CompatibilityDto } from './dto/compatibility.dto';
import { HoroscopeDto } from './dto/horoscope.dto';
import { KundliDto } from './dto/kundli.dto';
import { requestClientLeft } from './kundli-cancel';
import { MonthlyHoroscopeDto } from './dto/monthly-horoscope.dto';
import { PalmReadingDto } from './dto/palm-reading.dto';
import { UnlockToolDto } from './dto/unlock-tool.dto';
import { DetailedCompatibilityGuard } from './guards/detailed-compatibility.guard';
import { DetailedKundliGuard } from './guards/detailed-kundli.guard';
import {
  ToolsService,
  type CompatibilityDetailedResponse,
  type CompatibilityResponse,
  type HoroscopeResponse,
  type KundliDetailedResponse,
  type KundliResponse,
  type MonthlyHoroscopeResponse,
  type PalmReadingResponse,
  type TarotResponse,
  type UnlockedToolsResponse,
  type UnlockToolResponse,
} from './tools.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post('kundli')
  @UseGuards(DetailedKundliGuard)
  getKundli(
    @Req() req: Request,
    @Body() dto: KundliDto,
    @Headers('x-client-platform') clientPlatform?: string,
    @CurrentUser('sub') userId?: string,
  ): Promise<KundliResponse | KundliDetailedResponse> {
    return this.toolsService.getKundli(
      dto,
      userId,
      parseClientPlatform(clientPlatform),
      () => requestClientLeft(req),
    );
  }

  @Post('horoscope')
  @UseGuards(OptionalJwtGuard)
  getHoroscope(
    @Body() dto: HoroscopeDto,
    @CurrentUser('sub') userId?: string,
  ): Promise<HoroscopeResponse> {
    return this.toolsService.getHoroscope(dto, userId);
  }

  @Post('compatibility')
  @UseGuards(DetailedCompatibilityGuard)
  getCompatibility(
    @Body() dto: CompatibilityDto,
    @Headers('x-client-platform') clientPlatform?: string,
    @CurrentUser('sub') userId?: string,
  ): Promise<CompatibilityResponse | CompatibilityDetailedResponse> {
    return this.toolsService.getCompatibility(
      dto,
      userId,
      parseClientPlatform(clientPlatform),
    );
  }

  @Post('tarot')
  @UseGuards(OptionalJwtGuard)
  getTarot(@CurrentUser('sub') userId?: string): Promise<TarotResponse> {
    return this.toolsService.getTarot(userId);
  }

  @Post('palm-reading')
  @UseGuards(OptionalJwtGuard)
  getPalmReading(
    @Body() dto: PalmReadingDto,
    @CurrentUser('sub') userId?: string,
  ): Promise<PalmReadingResponse> {
    return this.toolsService.getPalmReading(dto, userId);
  }

  @Post('monthly-horoscope')
  getMonthlyHoroscope(
    @Body() dto: MonthlyHoroscopeDto,
  ): Promise<MonthlyHoroscopeResponse> {
    return this.toolsService.getMonthlyHoroscope(dto);
  }

  @Post('unlock')
  @UseGuards(JwtAuthGuard)
  unlockTool(
    @CurrentUser('sub') userId: string,
    @Body() dto: UnlockToolDto,
    @Headers('x-client-platform') clientPlatform?: string,
  ): Promise<UnlockToolResponse> {
    return this.toolsService.unlockTool(
      userId,
      dto.toolType,
      dto.reportPayload,
      parseClientPlatform(clientPlatform),
    );
  }

  @Get('unlocked')
  @UseGuards(JwtAuthGuard)
  getUnlockedTools(
    @CurrentUser('sub') userId: string,
  ): Promise<UnlockedToolsResponse> {
    return this.toolsService.getUnlockedTools(userId);
  }
}
