import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ArticleCategory, ArticleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PanditArticlesService } from './pandit-articles.service';
import { AVATAR_STORAGE } from '../avatar/avatar-storage.interface';

const pandit = {
  id: 'pandit-1',
  userId: 'user-1',
  name: 'Pt. Rajesh Sharma',
  imageUrl: 'https://cdn.example/p.jpg',
  headline: 'Vedic astrologer',
  isVerified: true,
};

const draft = {
  id: 'art-1',
  title: 'Draft title',
  slug: 'draft-title',
  category: ArticleCategory.astrology,
  author: pandit.name,
  authorPanditId: pandit.id,
  status: ArticleStatus.draft,
  language: 'en',
  coverImageUrl: 'https://img',
  coverAlt: null,
  excerpt: 'Hello',
  content: 'Hello world',
  seoTitle: null,
  seoDescription: null,
  readTimeMinutes: 1,
  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
  scheduledAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('PanditArticlesService', () => {
  let service: PanditArticlesService;
  const prisma = {
    article: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    articleEvent: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const storage = { put: jest.fn(), delete: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PanditArticlesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AVATAR_STORAGE, useValue: storage },
      ],
    }).compile();
    service = module.get(PanditArticlesService);
  });

  it('creates a draft owned by the pandit', async () => {
    prisma.article.findUnique.mockResolvedValue(null);
    prisma.article.create.mockResolvedValue(draft);

    const created = await service.create(pandit, {
      title: 'Draft title',
      content: 'Hello world',
      category: ArticleCategory.astrology,
    });

    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorPanditId: pandit.id,
          author: pandit.name,
          status: ArticleStatus.draft,
          title: 'Draft title',
        }),
      }),
    );
    expect(created.status).toBe('draft');
  });

  it('refuses to update another pandit article', async () => {
    prisma.article.findFirst.mockResolvedValue({
      ...draft,
      authorPanditId: 'other-pandit',
    });

    await expect(
      service.update(pandit, 'art-1', { title: 'Nope' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses to edit editorial articles', async () => {
    prisma.article.findFirst.mockResolvedValue({
      ...draft,
      authorPanditId: null,
    });

    await expect(
      service.update(pandit, 'art-1', { title: 'Nope' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('publishes immediately', async () => {
    prisma.article.findFirst.mockResolvedValue(draft);
    prisma.article.update.mockResolvedValue({
      ...draft,
      status: ArticleStatus.published,
    });

    const published = await service.publish(pandit, 'art-1', {});
    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ArticleStatus.published }),
      }),
    );
    expect(published.status).toBe('published');
  });

  it('schedules a future publish', async () => {
    prisma.article.findFirst.mockResolvedValue(draft);
    const when = new Date(Date.now() + 86400000).toISOString();
    prisma.article.update.mockResolvedValue({
      ...draft,
      status: ArticleStatus.scheduled,
      scheduledAt: new Date(when),
    });

    const scheduled = await service.publish(pandit, 'art-1', {
      scheduledAt: when,
    });
    expect(scheduled.status).toBe('scheduled');
  });

  it('rejects a past schedule', async () => {
    prisma.article.findFirst.mockResolvedValue(draft);
    await expect(
      service.publish(pandit, 'art-1', {
        scheduledAt: '2020-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('unpublishes an owned article', async () => {
    prisma.article.findFirst.mockResolvedValue({
      ...draft,
      status: ArticleStatus.published,
    });
    prisma.article.update.mockResolvedValue({
      ...draft,
      status: ArticleStatus.unpublished,
    });
    const result = await service.unpublish(pandit, 'art-1');
    expect(result.status).toBe('unpublished');
  });

  it('404s when the article is missing', async () => {
    prisma.article.findFirst.mockResolvedValue(null);
    await expect(service.getMine(pandit, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('fills a 30-day performance series', async () => {
    prisma.article.findMany.mockResolvedValue([
      { id: 'art-1', title: 'Draft title', slug: 'draft-title' },
    ]);
    prisma.articleEvent.findMany.mockResolvedValue([]);
    const stats = await service.stats(pandit);
    expect(stats.series).toHaveLength(30);
    expect(stats.totals.views).toBe(0);
  });
});
