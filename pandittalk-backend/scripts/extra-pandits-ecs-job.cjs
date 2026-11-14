const { Prisma, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CDN = 'https://d3ffeab65q7qta.cloudfront.net';
const v = Date.now();
const UPDATES = [
  {
    id: '9c4e2210-eb28-43c6-b9fb-d0083fb4900b',
    rating: '4.8',
    totalReviews: 72,
  },
  {
    id: '7c1151ff-099e-4092-964e-7587f93bf7d5',
    rating: '4.7',
    totalReviews: 54,
  },
  {
    id: 'a5d34056-c896-424a-bcd1-4529ca167b73',
    rating: '4.85',
    totalReviews: 88,
  },
  {
    id: '0452d451-5274-47ac-af5a-2e2561dd2c98',
    rating: '4.75',
    totalReviews: 63,
  },
];

async function main() {
  for (const row of UPDATES) {
    const imageUrl = `${CDN}/avatars/pandits/${row.id}.jpg?v=${v}`;
    const updated = await prisma.pandit.update({
      where: { id: row.id },
      data: {
        rating: new Prisma.Decimal(row.rating),
        totalReviews: row.totalReviews,
        imageUrl,
      },
      select: { id: true, name: true },
    });
    console.log('updated ' + updated.name);
  }
  console.log('done ' + UPDATES.length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
