import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ArticleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ArticlesService } from './articles.service';

const published = {
  id: 'pub-1',
  title: 'Live',
  slug: 'live',
  category: 'astrology',
  author: 'Editorial',
  authorPanditId: null,
  authorPandit: null,
  status: ArticleStatus.published,
  language: 'en',
  coverImageUrl: 'https://img',
  coverAlt: null,
  excerpt: 'Hi',
  content: 'Body',
  seoTitle: null,
  seoDescription: null,
  readTimeMinutes: 1,
  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
  scheduledAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ArticlesService public reads', () => {
  let service: ArticlesService;
  const prisma = {
    article: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    articleEvent: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ArticlesService);
  });

  it('lists only live articles', async () => {
    prisma.article.findMany.mockResolvedValue([published]);
    const result = await service.findAll({ limit: 10 });
    expect(prisma.article.findMany).toHaveBeenCalled();
    const where = prisma.article.findMany.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain('published');
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].slug).toBe('live');
  });

  it('hides drafts by slug', async () => {
    prisma.article.findUnique.mockResolvedValue({
      ...published,
      status: ArticleStatus.draft,
    });
    await expect(service.findBySlug('live')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('records a view on a public article', async () => {
    prisma.article.findUnique.mockResolvedValue({
      id: published.id,
      status: ArticleStatus.published,
      publishedAt: published.publishedAt,
      scheduledAt: null,
    });
    prisma.articleEvent.create.mockResolvedValue({});
    await expect(
      service.recordEvent('live', { type: 'view', source: 'app' }),
    ).resolves.toEqual({ ok: true });
  });
});
