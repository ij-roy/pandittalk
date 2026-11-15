import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleCategory, ArticleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CATEGORY_COVER_IMAGES: Record<ArticleCategory, string> = {
  astrology:
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop',
  spirituality:
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=400&fit=crop',
  vastu:
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=400&fit=crop',
  numerology:
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop',
  tarot:
    'https://images.unsplash.com/photo-1509245853830-fb36a1f1f1c1?w=800&h=400&fit=crop',
  palmistry:
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=400&fit=crop',
  relationships:
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=400&fit=crop',
  career:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
};

function coverImageForCategory(category: ArticleCategory): string {
  return CATEGORY_COVER_IMAGES[category] ?? CATEGORY_COVER_IMAGES.spirituality;
}

const LABEL_CATEGORY_MAP: Record<string, ArticleCategory> = {
  astrology: 'astrology',
  spirituality: 'spirituality',
  vastu: 'vastu',
  numerology: 'numerology',
  tarot: 'tarot',
  palmistry: 'palmistry',
  relationships: 'relationships',
  career: 'career',
  love: 'relationships',
  health: 'spirituality',
};

type BloggerPost = {
  id: string;
  title?: string;
  content?: string;
  published?: string;
  url?: string;
  labels?: string[];
};

type BloggerPostsResponse = {
  items?: BloggerPost[];
};

export type BloggerSyncResult = {
  synced: number;
  skipped: number;
};

@Injectable()
export class BloggerSyncService implements OnModuleInit {
  private readonly logger = new Logger(BloggerSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const syncOnStartup =
      this.config.get<string>('BLOGGER_SYNC_ON_STARTUP') === 'true';
    if (!syncOnStartup || !this.isConfigured()) {
      return;
    }

    try {
      const result = await this.syncFromBlogger();
      this.logger.log(
        `Startup Blogger sync complete: ${result.synced} synced, ${result.skipped} skipped`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Startup Blogger sync failed: ${message}`);
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_BLOGGER_API_KEY')?.trim() &&
      this.config.get<string>('GOOGLE_BLOGGER_BLOG_ID')?.trim(),
    );
  }

  assertSyncAuthorized(providedSecret: string | undefined): void {
    const expected = this.config.get<string>('BLOGGER_SYNC_SECRET')?.trim();
    if (!expected) {
      return;
    }
    if (!providedSecret || providedSecret !== expected) {
      throw new UnauthorizedException('Invalid Blogger sync secret');
    }
  }

  async syncFromBlogger(): Promise<BloggerSyncResult> {
    const apiKey = this.config.get<string>('GOOGLE_BLOGGER_API_KEY')?.trim();
    const blogId = this.config.get<string>('GOOGLE_BLOGGER_BLOG_ID')?.trim();

    if (!apiKey || !blogId) {
      throw new BadRequestException(
        'GOOGLE_BLOGGER_API_KEY and GOOGLE_BLOGGER_BLOG_ID must be set',
      );
    }

    const url = new URL(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts`,
    );
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fetchBodies', 'true');
    url.searchParams.set('maxResults', '50');

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        `Blogger API error (${response.status}): ${body.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as BloggerPostsResponse;
    const items = payload.items ?? [];

    let synced = 0;
    let skipped = 0;

    for (const post of items) {
      const title = post.title?.trim();
      const content = post.content?.trim();
      const published = post.published;

      if (!title || !content || !published) {
        skipped += 1;
        continue;
      }

      const slug = `${slugify(title)}-blogger-${post.id}`;
      const markdown = htmlToMarkdown(content);
      const excerpt = plainTextExcerpt(markdown, 150);
      const category = resolveCategory(post.labels);
      const publishedAt = new Date(published);

      await this.prisma.article.upsert({
        where: { slug },
        create: {
          title,
          slug,
          category,
          coverImageUrl: coverImageForCategory(category),
          excerpt,
          content: markdown,
          readTimeMinutes: estimateReadTimeMinutes(markdown),
          publishedAt,
          status: ArticleStatus.published,
        },
        update: {
          title,
          category,
          coverImageUrl: coverImageForCategory(category),
          excerpt,
          content: markdown,
          readTimeMinutes: estimateReadTimeMinutes(markdown),
          publishedAt,
          status: ArticleStatus.published,
        },
      });

      synced += 1;
    }

    return { synced, skipped };
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function estimateReadTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function resolveCategory(labels: string[] | undefined): ArticleCategory {
  if (!labels?.length) {
    return 'spirituality';
  }

  for (const label of labels) {
    const key = label.trim().toLowerCase();
    const mapped = LABEL_CATEGORY_MAP[key];
    if (mapped) {
      return mapped;
    }
  }

  return 'spirituality';
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function plainTextExcerpt(markdown: string, maxLength: number): string {
  const plain = markdown.replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength - 3)}...`;
}
