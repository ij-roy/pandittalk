import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Pandit } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentPandit } from './decorators/current-pandit.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { ListPanditArticlesQueryDto } from './dto/list-pandit-articles-query.dto';
import { PublishArticleDto } from './dto/publish-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PanditGuard } from './guards/pandit.guard';
import {
  PanditArticlesService,
  type ArticleStatsResponse,
  type PanditArticleListResponse,
  type PanditArticlePayload,
} from './pandit-articles.service';

@Controller('pandit/articles')
@UseGuards(JwtAuthGuard, PanditGuard)
export class PanditArticlesController {
  constructor(private readonly panditArticles: PanditArticlesService) {}

  @Get()
  list(
    @CurrentPandit() pandit: Pandit,
    @Query() query: ListPanditArticlesQueryDto,
  ): Promise<PanditArticleListResponse> {
    return this.panditArticles.listMine(pandit, query);
  }

  @Get('stats')
  stats(@CurrentPandit() pandit: Pandit): Promise<ArticleStatsResponse> {
    return this.panditArticles.stats(pandit);
  }

  @Post()
  create(
    @CurrentPandit() pandit: Pandit,
    @Body() dto: CreateArticleDto,
  ): Promise<PanditArticlePayload> {
    return this.panditArticles.create(pandit, dto);
  }

  @Get(':id')
  getOne(
    @CurrentPandit() pandit: Pandit,
    @Param('id') id: string,
  ): Promise<PanditArticlePayload> {
    return this.panditArticles.getMine(pandit, id);
  }

  @Patch(':id')
  update(
    @CurrentPandit() pandit: Pandit,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ): Promise<PanditArticlePayload> {
    return this.panditArticles.update(pandit, id, dto);
  }

  @Post(':id/publish')
  publish(
    @CurrentPandit() pandit: Pandit,
    @Param('id') id: string,
    @Body() dto: PublishArticleDto,
  ): Promise<PanditArticlePayload> {
    return this.panditArticles.publish(pandit, id, dto);
  }

  @Post(':id/unpublish')
  unpublish(
    @CurrentPandit() pandit: Pandit,
    @Param('id') id: string,
  ): Promise<PanditArticlePayload> {
    return this.panditArticles.unpublish(pandit, id);
  }

  @Delete(':id')
  deleteDraft(
    @CurrentPandit() pandit: Pandit,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    return this.panditArticles.deleteDraft(pandit, id);
  }

  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadCover(
    @CurrentPandit() pandit: Pandit,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PanditArticlePayload> {
    return this.panditArticles.uploadCover(pandit, id, file);
  }
}
