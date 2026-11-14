import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

const TOOL_TYPES = [
  'monthly_horoscope',
  'detailed_kundli',
  'detailed_compatibility',
] as const;

type ToolType = (typeof TOOL_TYPES)[number];

const REFUND_AMOUNTS: Record<ToolType, number> = {
  monthly_horoscope: 101,
  detailed_kundli: 251,
  detailed_compatibility: 201,
};

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+91')) {
    return trimmed;
  }
  return `+91${trimmed}`;
}

function isToolType(value: string): value is ToolType {
  return (TOOL_TYPES as readonly string[]).includes(value);
}

async function main(): Promise<void> {
  const [, , phoneArg, toolTypeArg] = process.argv;

  if (!phoneArg || !toolTypeArg) {
    console.error(
      'Usage: npx ts-node scripts/reset-tool-unlock.ts <phone> <toolType>',
    );
    console.error(
      'Tool types: monthly_horoscope | detailed_kundli | detailed_compatibility',
    );
    process.exit(1);
  }

  if (!isToolType(toolTypeArg)) {
    console.error(`Invalid tool type: ${toolTypeArg}`);
    console.error(
      'Valid types: monthly_horoscope | detailed_kundli | detailed_compatibility',
    );
    process.exit(1);
  }

  const phoneNumber = normalizePhone(phoneArg);
  const description = `Unlocked ${toolTypeArg}`;

  const user = await prisma.user.findUnique({
    where: { phoneNumber },
    select: { id: true, walletBalance: true },
  });

  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  const { deletedCount, newBalance } = await prisma.$transaction(async (tx) => {
    const deleteResult = await tx.transaction.deleteMany({
      where: {
        userId: user.id,
        description,
      },
    });

    if (deleteResult.count === 0) {
      return {
        deletedCount: 0,
        newBalance: Number(user.walletBalance),
      };
    }

    const refund = REFUND_AMOUNTS[toolTypeArg] * deleteResult.count;
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { walletBalance: { increment: refund } },
      select: { walletBalance: true },
    });

    return {
      deletedCount: deleteResult.count,
      newBalance: Number(updatedUser.walletBalance),
    };
  });

  console.log(`Deleted ${deletedCount} transaction(s)`);
  console.log(`New wallet balance: ${Math.floor(newBalance)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
//npm run reset:tool 9799983609 monthly_horoscope
//npm run reset:tool 9799983609 detailed_kundli
//npm run reset:tool 9799983609 detailed_compatibility