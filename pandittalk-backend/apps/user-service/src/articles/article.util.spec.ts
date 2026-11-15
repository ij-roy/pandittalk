import { ArticleStatus } from '@prisma/client';
import {
  detectLanguage,
  excerptFromContent,
  estimateReadTimeMinutes,
  isPubliclyVisible,
  slugifyTitle,
} from './article.util';

describe('article.util', () => {
  it('slugifies latin titles and drops hindi glyphs', () => {
    expect(slugifyTitle('Raksha Bandhan 2026: सिर्फ राखी')).toBe(
      'raksha-bandhan-2026',
    );
  });

  it('returns empty slug for hindi-only titles', () => {
    expect(slugifyTitle('गणेश जी को सबसे पहले क्यों पूजा जाता है')).toBe('');
  });

  it('estimates read time at 200 wpm with a 1 minute floor', () => {
    expect(estimateReadTimeMinutes('one two')).toBe(1);
    const words = Array.from({ length: 401 }, () => 'word').join(' ');
    expect(estimateReadTimeMinutes(words)).toBe(3);
  });

  it('builds a plain excerpt', () => {
    expect(excerptFromContent('## Hello **world**', 20)).toBe('Hello world');
  });

  it('detects hindi, english, and mixed copy', () => {
    expect(
      detectLanguage(
        'Hello world',
        'This is an english article about vastu and career guidance for families.',
      ),
    ).toBe('en');
    expect(
      detectLanguage(
        'राखी',
        'यह लेख पूरी तरह हिंदी में लिखा गया है और इसमें ज्योतिष तथा आध्यात्मिक सलाह दी गई है।',
      ),
    ).toBe('hi');
  });

  it('treats published and due scheduled articles as public', () => {
    const now = new Date('2026-09-08T12:00:00.000Z');
    expect(
      isPubliclyVisible(
        {
          status: ArticleStatus.draft,
          publishedAt: now,
          scheduledAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isPubliclyVisible(
        {
          status: ArticleStatus.published,
          publishedAt: new Date('2026-09-08T11:00:00.000Z'),
          scheduledAt: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      isPubliclyVisible(
        {
          status: ArticleStatus.scheduled,
          publishedAt: now,
          scheduledAt: new Date('2026-09-08T11:59:00.000Z'),
        },
        now,
      ),
    ).toBe(true);
    expect(
      isPubliclyVisible(
        {
          status: ArticleStatus.scheduled,
          publishedAt: now,
          scheduledAt: new Date('2026-09-08T12:01:00.000Z'),
        },
        now,
      ),
    ).toBe(false);
  });
});
