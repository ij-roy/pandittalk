import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BloggerSyncService } from './blogger-sync.service';
import {
  ArticlesService,
  type ArticleDetail,
  type PaginatedArticlesResponse,
  type SitemapArticle,
} from './articles.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { RecordArticleEventDto } from './dto/record-article-event.dto';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly bloggerSyncService: BloggerSyncService,
  ) {}

  @Get()
  findAll(
    @Query() query: ListArticlesQueryDto,
  ): Promise<PaginatedArticlesResponse> {
    return this.articlesService.findAll(query);
  }

  @Get('sitemap')
  sitemap(): Promise<SitemapArticle[]> {
    return this.articlesService.sitemap();
  }

  @Get('authors/:panditId')
  findAuthor(@Param('panditId') panditId: string) {
    return this.articlesService.findAuthorPublished(panditId);
  }

  @Post('sync/blogger')
  syncFromBlogger(
    @Headers('x-blogger-sync-secret') syncSecret?: string,
  ): Promise<{ synced: number; skipped: number }> {
    this.bloggerSyncService.assertSyncAuthorized(syncSecret);
    return this.bloggerSyncService.syncFromBlogger();
  }

  @Post(':slug/events')
  recordEvent(
    @Param('slug') slug: string,
    @Body() dto: RecordArticleEventDto,
  ): Promise<{ ok: true }> {
    return this.articlesService.recordEvent(slug, dto);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<ArticleDetail> {
    return this.articlesService.findBySlug(slug);
  }
}
