import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Article,
  ArticleCategory,
  ArticleLanguage,
  ArticleStatus,
  Pandit,
  Prisma,
} from '@prisma/client';
import {
  AVATAR_STORAGE,
  type AvatarStorage,
} from '../avatar/avatar-storage.interface';
import { PrismaService } from '../prisma/prisma.service';
import {
  coverImageForCategory,
  detectLanguage,
  excerptFromContent,
  estimateReadTimeMinutes,
  slugifyTitle,
} from './article.util';
import type { CreateArticleDto } from './dto/create-article.dto';
import type { ListPanditArticlesQueryDto } from './dto/list-pandit-articles-query.dto';
import type { PublishArticleDto } from './dto/publish-article.dto';

function istDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function lastNIstDays(n: number, now = new Date()): string[] {
  const [year, month, day] = istDateKey(now).split('-').map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const point = new Date(cursor);
    point.setUTCDate(cursor.getUTCDate() - i);
    days.push(point.toISOString().slice(0, 10));
  }
  return days;
}
import type { UpdateArticleDto } from './dto/update-article.dto';

export type PanditArticlePayload = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  author: string;
  authorPanditId: string | null;
  status: ArticleStatus;
  language: ArticleLanguage;
  coverImageUrl: string;
  coverAlt: string | null;
  excerpt: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  readTimeMinutes: number;
  publishedAt: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PanditArticleListResponse = {
  articles: PanditArticlePayload[];
  total: number;
};

export type ArticleStatsPoint = {
  date: string;
  views: number;
  reads: number;
  ctaClicks: number;
};

export type ArticleStatsResponse = {
  totals: { views: number; reads: number; ctaClicks: number };
  bySource: { app: number; web: number };
  series: ArticleStatsPoint[];
  topArticles: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
  }>;
};

const ALLOWED_COVER_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_COVER_BYTES = 5 * 1024 * 1024;

@Injectable()
export class PanditArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AVATAR_STORAGE) private readonly storage: AvatarStorage,
  ) {}

  async listMine(
    pandit: Pandit,
    query: ListPanditArticlesQueryDto,
  ): Promise<PanditArticleListResponse> {
    const where: Prisma.ArticleWhereInput = {
      authorPanditId: pandit.id,
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { excerpt: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: rows.map((row) => this.toPayload(row)),
      total,
    };
  }

  async getMine(pandit: Pandit, id: string): Promise<PanditArticlePayload> {
    const article = await this.requireOwned(pandit, id);
    return this.toPayload(article);
  }

  async create(
    pandit: Pandit,
    dto: CreateArticleDto,
  ): Promise<PanditArticlePayload> {
    const title = dto.title.trim();
    const content = dto.content?.trim() ?? '';
    const category = dto.category ?? ArticleCategory.spirituality;
    const slug = await this.uniqueSlug(dto.slug?.trim() || slugifyTitle(title));
    const excerpt =
      dto.excerpt?.trim() || excerptFromContent(content || title);

    const created = await this.prisma.article.create({
      data: {
        title,
        slug,
        category,
        author: pandit.name,
        authorPanditId: pandit.id,
        status: ArticleStatus.draft,
        language: dto.language ?? detectLanguage(title, content),
        coverImageUrl: dto.coverImageUrl?.trim() || coverImageForCategory(category),
        coverAlt: dto.coverAlt?.trim() || null,
        excerpt: excerpt.slice(0, 280),
        content,
        seoTitle: dto.seoTitle?.trim() || null,
        seoDescription: dto.seoDescription?.trim() || null,
        readTimeMinutes: estimateReadTimeMinutes(content || title),
        publishedAt: new Date(),
      },
    });

    return this.toPayload(created);
  }

  async update(
    pandit: Pandit,
    id: string,
    dto: UpdateArticleDto,
  ): Promise<PanditArticlePayload> {
    const existing = await this.requireOwned(pandit, id);
    const title = dto.title?.trim() ?? existing.title;
    const content = dto.content ?? existing.content;
    const category = dto.category ?? existing.category;
    let slug = existing.slug;
    if (dto.slug?.trim() && dto.slug.trim() !== existing.slug) {
      slug = await this.uniqueSlug(dto.slug.trim(), existing.id);
    }

    const excerpt =
      dto.excerpt?.trim() ||
      existing.excerpt ||
      excerptFromContent(content || title);

    const updated = await this.prisma.article.update({
      where: { id: existing.id },
      data: {
        title,
        slug,
        category,
        language: dto.language ?? detectLanguage(title, content),
        coverImageUrl:
          dto.coverImageUrl?.trim() || existing.coverImageUrl,
        coverAlt:
          dto.coverAlt === undefined
            ? existing.coverAlt
            : dto.coverAlt.trim() || null,
        excerpt: excerpt.slice(0, 280),
        content,
        seoTitle:
          dto.seoTitle === undefined
            ? existing.seoTitle
            : dto.seoTitle.trim() || null,
        seoDescription:
          dto.seoDescription === undefined
            ? existing.seoDescription
            : dto.seoDescription.trim() || null,
        readTimeMinutes: estimateReadTimeMinutes(content || title),
        author: pandit.name,
      },
    });

    return this.toPayload(updated);
  }

  async publish(
    pandit: Pandit,
    id: string,
    dto: PublishArticleDto,
  ): Promise<PanditArticlePayload> {
    const existing = await this.requireOwned(pandit, id);
    if (!existing.title.trim() || !existing.content.trim()) {
      throw new BadRequestException('Add a title and body before publishing');
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('scheduledAt must be a valid date');
    }
    if (scheduledAt && scheduledAt.getTime() <= Date.now() + 30_000) {
      throw new BadRequestException('Schedule time must be in the future');
    }

    const now = new Date();
    const updated = await this.prisma.article.update({
      where: { id: existing.id },
      data: scheduledAt
        ? {
            status: ArticleStatus.scheduled,
            scheduledAt,
            publishedAt: scheduledAt,
          }
        : {
            status: ArticleStatus.published,
            scheduledAt: null,
            publishedAt: now,
          },
    });

    return this.toPayload(updated);
  }

  async unpublish(
    pandit: Pandit,
    id: string,
  ): Promise<PanditArticlePayload> {
    const existing = await this.requireOwned(pandit, id);
    const updated = await this.prisma.article.update({
      where: { id: existing.id },
      data: { status: ArticleStatus.unpublished, scheduledAt: null },
    });
    return this.toPayload(updated);
  }

  async deleteDraft(
    pandit: Pandit,
    id: string,
  ): Promise<{ id: string }> {
    const existing = await this.requireOwned(pandit, id);
    if (
      existing.status !== ArticleStatus.draft &&
      existing.status !== ArticleStatus.unpublished
    ) {
      throw new BadRequestException(
        'Only draft or unpublished articles can be deleted',
      );
    }
    await this.prisma.article.delete({ where: { id: existing.id } });
    return { id: existing.id };
  }

  async uploadCover(
    pandit: Pandit,
    id: string,
    file: Express.Multer.File | undefined,
  ): Promise<PanditArticlePayload> {
    const existing = await this.requireOwned(pandit, id);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Cover image is required');
    }
    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!ALLOWED_COVER_MIMES.has(mime)) {
      throw new BadRequestException('Cover must be a JPEG, PNG, or WebP image');
    }
    if (file.size > MAX_COVER_BYTES) {
      throw new BadRequestException('Cover image must be 5MB or smaller');
    }

    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const key = `articles/${existing.id}/cover.${ext}`;
    const url = await this.storage.put(key, file.buffer, mime);
    const coverImageUrl = `${url}?v=${Date.now()}`;

    const updated = await this.prisma.article.update({
      where: { id: existing.id },
      data: { coverImageUrl },
    });
    return this.toPayload(updated);
  }

  async stats(
    pandit: Pandit,
    days = 30,
  ): Promise<ArticleStatsResponse> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const mine = await this.prisma.article.findMany({
      where: { authorPanditId: pandit.id },
      select: { id: true, title: true, slug: true },
    });
    const ids = mine.map((a) => a.id);
    if (ids.length === 0) {
      return {
        totals: { views: 0, reads: 0, ctaClicks: 0 },
        bySource: { app: 0, web: 0 },
        series: [],
        topArticles: [],
      };
    }

    const events = await this.prisma.articleEvent.findMany({
      where: { articleId: { in: ids }, createdAt: { gte: since } },
      select: {
        articleId: true,
        type: true,
        source: true,
        createdAt: true,
      },
    });

    const totals = { views: 0, reads: 0, ctaClicks: 0 };
    const bySource = { app: 0, web: 0 };
    const byDay = new Map<string, ArticleStatsPoint>();
    const byArticle = new Map<string, number>();

    for (const event of events) {
      const day = istDateKey(event.createdAt);
      const point = byDay.get(day) ?? {
        date: day,
        views: 0,
        reads: 0,
        ctaClicks: 0,
      };
      if (event.type === 'view') {
        totals.views += 1;
        point.views += 1;
        byArticle.set(event.articleId, (byArticle.get(event.articleId) ?? 0) + 1);
      } else if (event.type === 'read') {
        totals.reads += 1;
        point.reads += 1;
      } else {
        totals.ctaClicks += 1;
        point.ctaClicks += 1;
      }
      if (event.source === 'app') bySource.app += 1;
      else bySource.web += 1;
      byDay.set(day, point);
    }

    const series = lastNIstDays(days).map((date) => {
      return (
        byDay.get(date) ?? {
          date,
          views: 0,
          reads: 0,
          ctaClicks: 0,
        }
      );
    });
    const topArticles = [...byArticle.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, views]) => {
        const row = mine.find((a) => a.id === id)!;
        return { id: row.id, title: row.title, slug: row.slug, views };
      });

    return { totals, bySource, series, topArticles };
  }

  private async requireOwned(pandit: Pandit, id: string): Promise<Article> {
    const article = await this.prisma.article.findFirst({
      where: { id },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (!article.authorPanditId || article.authorPanditId !== pandit.id) {
      throw new ForbiddenException('You can only edit your own articles');
    }
    return article;
  }

  private async uniqueSlug(desired: string, excludeId?: string): Promise<string> {
    const base = slugifyTitle(desired) || `article-${Date.now().toString(36)}`;
    let candidate = base;
    let n = 2;
    while (true) {
      const existing = await this.prisma.article.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${base}-${n}`;
      n += 1;
    }
  }

  private toPayload(article: Article): PanditArticlePayload {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      author: article.author,
      authorPanditId: article.authorPanditId,
      status: article.status,
      language: article.language,
      coverImageUrl: article.coverImageUrl,
      coverAlt: article.coverAlt,
      excerpt: article.excerpt,
      content: article.content,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      readTimeMinutes: article.readTimeMinutes,
      publishedAt: article.publishedAt.toISOString(),
      scheduledAt: article.scheduledAt?.toISOString() ?? null,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };
  }
}
