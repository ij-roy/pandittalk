const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const pandits = await prisma.pandit.findMany({
    select: { id: true, name: true },
  });

  let updated = 0;
  for (const row of pandits) {
    if (!row.name.startsWith('Pt.')) continue;
    const next = `Shri${row.name.slice('Pt.'.length)}`;
    await prisma.pandit.update({
      where: { id: row.id },
      data: { name: next },
    });
    console.log(`${row.name} -> ${next}`);
    updated += 1;
  }

  console.log(`done updated=${updated} scanned=${pandits.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
