import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Article,
  ArticleCategory,
  ArticleEventSource,
  ArticleEventType,
  ArticleLanguage,
  ArticleStatus,
  Pandit,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isPubliclyVisible } from './article.util';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import type { RecordArticleEventDto } from './dto/record-article-event.dto';

export type PublicAuthor = {
  id: string;
  name: string;
  headline: string;
  imageUrl: string | null;
  specialty: string;
};

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  author: string;
  authorPanditId: string | null;
  authorProfile: PublicAuthor | null;
  language: ArticleLanguage;
  coverImageUrl: string;
  coverAlt: string | null;
  excerpt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  readTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
};

export type ArticleDetail = ArticleListItem & {
  content: string;
};

export type PaginatedArticlesResponse = {
  articles: ArticleListItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type SitemapArticle = {
  slug: string;
  updatedAt: string;
  publishedAt: string;
};

type ArticleWithAuthor = Article & { authorPandit: Pandit | null };

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListArticlesQueryDto,
  ): Promise<PaginatedArticlesResponse> {
    await this.promoteDueScheduled();
    const limit = query.limit ?? 10;
    const now = new Date();

    const baseWhere: Prisma.ArticleWhereInput = {
      AND: [
        this.publicWhere(now),
        query.category ? { category: query.category } : {},
        query.authorPanditId ? { authorPanditId: query.authorPanditId } : {},
        query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { excerpt: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    let cursorFilter: Prisma.ArticleWhereInput = {};
    if (query.cursor) {
      const cursorArticle = await this.prisma.article.findUnique({
        where: { id: query.cursor },
      });
      if (cursorArticle) {
        cursorFilter = {
          OR: [
            { publishedAt: { lt: cursorArticle.publishedAt } },
            {
              publishedAt: cursorArticle.publishedAt,
              id: { lt: cursorArticle.id },
            },
          ],
        };
      }
    }

    const articles = await this.prisma.article.findMany({
      where: { AND: [baseWhere, cursorFilter] },
      include: { authorPandit: true },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = articles.length > limit;
    const page = hasMore ? articles.slice(0, limit) : articles;
    const nextCursor =
      hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      articles: page.map((article) => this.toListItem(article)),
      nextCursor,
      hasMore,
    };
  }

  async findBySlug(slug: string): Promise<ArticleDetail> {
    await this.promoteDueScheduled();
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: { authorPandit: true },
    });

    if (!article || !isPubliclyVisible(article)) {
      throw new NotFoundException('Article not found');
    }

    return this.toDetail(article);
  }

  async sitemap(): Promise<SitemapArticle[]> {
    await this.promoteDueScheduled();
    const now = new Date();
    const rows = await this.prisma.article.findMany({
      where: this.publicWhere(now),
      orderBy: [{ publishedAt: 'desc' }],
      select: { slug: true, updatedAt: true, publishedAt: true },
    });
    return rows.map((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt.toISOString(),
      publishedAt: row.publishedAt.toISOString(),
    }));
  }

  async recordEvent(
    slug: string,
    dto: RecordArticleEventDto,
  ): Promise<{ ok: true }> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        scheduledAt: true,
      },
    });
    if (!article || !isPubliclyVisible(article)) {
      throw new NotFoundException('Article not found');
    }

    await this.prisma.articleEvent.create({
      data: {
        articleId: article.id,
        type: dto.type,
        source: dto.source,
      },
    });
    return { ok: true };
  }

  async findAuthorPublished(
    panditId: string,
  ): Promise<{ author: PublicAuthor; articles: ArticleListItem[] }> {
    await this.promoteDueScheduled();
    const pandit = await this.prisma.pandit.findUnique({
      where: { id: panditId },
    });
    if (!pandit) {
      throw new NotFoundException('Author not found');
    }

    const articles = await this.prisma.article.findMany({
      where: {
        AND: [this.publicWhere(new Date()), { authorPanditId: panditId }],
      },
      include: { authorPandit: true },
      orderBy: [{ publishedAt: 'desc' }],
    });

    return {
      author: this.toAuthor(pandit),
      articles: articles.map((article) => this.toListItem(article)),
    };
  }

  private publicWhere(now: Date): Prisma.ArticleWhereInput {
    return {
      OR: [
        { status: ArticleStatus.published, publishedAt: { lte: now } },
        { status: ArticleStatus.scheduled, scheduledAt: { lte: now } },
      ],
    };
  }

  private async promoteDueScheduled(): Promise<void> {
    const now = new Date();
    await this.prisma.article.updateMany({
      where: {
        status: ArticleStatus.scheduled,
        scheduledAt: { lte: now },
      },
      data: { status: ArticleStatus.published },
    });
  }

  private toAuthor(pandit: Pandit): PublicAuthor {
    return {
      id: pandit.id,
      name: pandit.name,
      headline: pandit.headline,
      imageUrl: pandit.imageUrl,
      specialty: pandit.specialty,
    };
  }

  private toListItem(article: ArticleWithAuthor): ArticleListItem {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      author: article.author,
      authorPanditId: article.authorPanditId,
      authorProfile: article.authorPandit
        ? this.toAuthor(article.authorPandit)
        : null,
      language: article.language,
      coverImageUrl: article.coverImageUrl,
      coverAlt: article.coverAlt,
      excerpt: article.excerpt,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      readTimeMinutes: article.readTimeMinutes,
      publishedAt: article.publishedAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      createdAt: article.createdAt.toISOString(),
    };
  }

  private toDetail(article: ArticleWithAuthor): ArticleDetail {
    return {
      ...this.toListItem(article),
      content: article.content,
    };
  }
}

export type { ArticleEventSource, ArticleEventType };
