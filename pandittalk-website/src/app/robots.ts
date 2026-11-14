import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/articles/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        // Authenticated / account surfaces — must stay out of sitemap and crawl.
        '/home', '/account', '/wallet', '/bookings', '/sessions', '/reports', '/notifications',
        '/profile-setup', '/login', '/verify-otp', '/link-phone',
        // Internal application form (public marketing is /for-pandits).
        '/join-as-pandit',
        // Legacy expert URL prefixes (canonical public profiles are /pandits/…).
        '/expert', '/experts',
        '/api/',
      ],
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
