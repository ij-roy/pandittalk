import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type {
  ExpertDetail,
  ExpertListItem,
  PanditMe,
  PanditPresence,
  SlotWithStatus,
} from './experts.service';
import { ExpertsService } from './experts.service';
import { ListExpertsQueryDto } from './dto/list-experts-query.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Controller('experts')
export class ExpertsController {
  constructor(private readonly expertsService: ExpertsService) {}

  @Get()
  findAll(@Query() query: ListExpertsQueryDto): Promise<ExpertListItem[]> {
    return this.expertsService.findAll(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMe(@CurrentUser('sub') userId: string): Promise<PanditMe> {
    return this.expertsService.findByUserId(userId);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  listFollowing(@CurrentUser('sub') userId: string) {
    return this.expertsService.listFollowing(userId);
  }

  @Get(':id/available-slots')
  getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('duration') duration: string,
  ): Promise<string[]> {
    const durationMinutes = this.parseSlotQuery(date, duration);
    return this.expertsService.computeAvailableSlots(id, date, durationMinutes);
  }

  @Get(':id/all-slots')
  getAllSlots(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('duration') duration: string,
  ): Promise<SlotWithStatus[]> {
    const durationMinutes = this.parseSlotQuery(date, duration);
    return this.expertsService.computeAllSlots(id, date, durationMinutes);
  }

  private parseSlotQuery(date: string, duration: string): number {
    if (!date || !DATE_PATTERN.test(date)) {
      throw new BadRequestException(
        'date query param is required (YYYY-MM-DD)',
      );
    }

    if (duration === undefined || duration === '') {
      throw new BadRequestException('duration query param is required');
    }

    const durationMinutes = Number(duration);
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      throw new BadRequestException('duration must be a positive integer');
    }

    return durationMinutes;
  }

  @Patch(':id/presence')
  @UseGuards(JwtAuthGuard)
  updatePresence(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePresenceDto,
  ): Promise<PanditPresence> {
    return this.expertsService.updatePresence(userId, id, dto.isOnline);
  }

  @Get(':id/follow')
  @UseGuards(JwtAuthGuard)
  followStatus(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.expertsService.isFollowing(userId, id);
  }

  @Put(':id/follow')
  @UseGuards(JwtAuthGuard)
  follow(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.expertsService.followPandit(userId, id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.expertsService.unfollowPandit(userId, id);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ExpertDetail> {
    return this.expertsService.findOne(id);
  }
}
