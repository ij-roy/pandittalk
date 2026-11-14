const { PrismaClient } = require('@prisma/client');

const ARTICLES_URL = process.env.EDITORIAL_ARTICLES_URL;
const prisma = new PrismaClient();

async function main() {
  if (!ARTICLES_URL) {
    throw new Error('EDITORIAL_ARTICLES_URL is required');
  }

  const response = await fetch(ARTICLES_URL);
  if (!response.ok) {
    throw new Error('fetch failed ' + response.status);
  }

  const articles = await response.json();
  if (!Array.isArray(articles) || articles.length !== 12) {
    throw new Error('expected 12 articles, got ' + (articles && articles.length));
  }

  const now = Date.now();
  for (let i = 0; i < articles.length; i += 1) {
    const article = articles[i];
    const publishedAt = new Date(now - i * 60 * 60 * 1000);
    const data = {
      title: article.title,
      category: article.category,
      author: article.author,
      coverImageUrl: article.coverImageUrl,
      excerpt: article.excerpt,
      content: article.content,
      readTimeMinutes: article.readTimeMinutes,
      publishedAt,
    };
    await prisma.article.upsert({
      where: { slug: article.slug },
      create: { slug: article.slug, ...data },
      update: data,
    });
    console.log('upserted ' + article.slug);
  }

  const count = await prisma.article.count();
  console.log('done ' + articles.length + ' total=' + count);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
