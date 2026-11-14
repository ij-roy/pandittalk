import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { PrismaClient } from '@prisma/client';
import {
  panditAvatarCdnUrl,
  panditAvatarObjectKey,
} from '../apps/user-service/src/avatar/avatar-storage.interface';
import {
  allStablePanditIds,
  PANDIT_STABLE_IDS,
} from '../apps/user-service/prisma/pandit-seed';

config();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function resolvePortraitsDir(): string {
  const dir = (process.argv[2] ?? process.env.PANDIT_PORTRAITS_DIR)?.trim();
  if (!dir) {
    console.error(
      'Usage: npm run upload:pandit-portraits -- <portraits-folder>',
    );
    console.error('Or set PANDIT_PORTRAITS_DIR');
    process.exit(1);
  }
  if (!existsSync(dir)) {
    throw new Error(`Portraits folder not found: ${dir}`);
  }
  return dir;
}

function listPortraitFiles(dir: string): string[] {
  return readdirSync(dir).filter((name) => {
    const ext = extname(name).toLowerCase();
    return ext === '.jpg' || ext === '.jpeg';
  });
}

function panditIdFromFilename(filename: string): string {
  return basename(filename, extname(filename));
}

function resolveAwsCredentials(): { accessKeyId: string; secretAccessKey: string; source: string } {
  const primaryId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const primarySecret = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (primaryId && primarySecret && primaryId !== 'local') {
    return {
      accessKeyId: primaryId,
      secretAccessKey: primarySecret,
      source: 'AWS_ACCESS_KEY_ID',
    };
  }

  const chimeId = process.env.AWS_CHIME_ACCESS_KEY_ID?.trim();
  const chimeSecret = process.env.AWS_CHIME_SECRET_ACCESS_KEY?.trim();
  if (chimeId && chimeSecret) {
    return {
      accessKeyId: chimeId,
      secretAccessKey: chimeSecret,
      source: 'AWS_CHIME_ACCESS_KEY_ID',
    };
  }

  throw new Error(
    'No valid AWS credentials: set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in .env or use an AWS SSO profile',
  );
}

async function main(): Promise<void> {
  const portraitsDir = resolvePortraitsDir();
  const { accessKeyId, secretAccessKey, source } = resolveAwsCredentials();
  console.log(`Using credentials from ${source} (key id prefix: ${accessKeyId.slice(0, 4)}…)\n`);
  const bucket = requireEnv('S3_MEDIA_BUCKET');
  const region = requireEnv('S3_MEDIA_REGION');
  const cdnBaseUrl = requireEnv('MEDIA_CDN_URL');

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const files = listPortraitFiles(portraitsDir);
  const processedPanditIds = new Set<string>();
  const unmatchedFiles: string[] = [];
  const failedFiles: string[] = [];
  let successCount = 0;

  console.log(`Scanning ${portraitsDir} (${files.length} JPEG file(s))…\n`);

  for (const filename of files) {
    const panditId = panditIdFromFilename(filename);
    const filePath = join(portraitsDir, filename);

    if (!UUID_RE.test(panditId)) {
      console.error(`SKIP ${filename}: invalid pandit UUID "${panditId}"`);
      unmatchedFiles.push(filename);
      continue;
    }

    const pandit = await prisma.pandit.findUnique({
      where: { id: panditId },
      select: { id: true, name: true },
    });

    if (!pandit) {
      console.error(`SKIP ${filename}: no pandit row for id ${panditId}`);
      unmatchedFiles.push(filename);
      continue;
    }

    try {
      const buffer = readFileSync(filePath);
      const key = panditAvatarObjectKey(panditId);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: 'image/jpeg',
        }),
      );

      const imageUrl = panditAvatarCdnUrl(cdnBaseUrl, panditId, Date.now());
      await prisma.pandit.update({
        where: { id: panditId },
        data: { imageUrl },
      });

      processedPanditIds.add(panditId);
      successCount += 1;
      console.log(`OK   ${pandit.name}`);
      console.log(`     s3://${bucket}/${key}`);
      console.log(`     ${imageUrl}\n`);
    } catch (err) {
      failedFiles.push(filename);
      console.error(
        `FAIL ${filename}: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }

  const missingPandits: Array<{ phone: string; id: string; name: string }> =
    [];
  for (const [phone, id] of Object.entries(PANDIT_STABLE_IDS)) {
    if (!processedPanditIds.has(id)) {
      const pandit = await prisma.pandit.findUnique({
        where: { id },
        select: { name: true },
      });
      missingPandits.push({
        phone,
        id,
        name: pandit?.name ?? '(not in DB)',
      });
    }
  }

  console.log('--- Summary ---');
  console.log(`Uploaded: ${successCount}`);
  if (unmatchedFiles.length > 0) {
    console.log(`Unmatched files (no pandit / bad UUID): ${unmatchedFiles.length}`);
    for (const f of unmatchedFiles) {
      console.log(`  - ${f}`);
    }
  }
  if (missingPandits.length > 0) {
    console.log(`Seeded pandits missing portrait file: ${missingPandits.length}`);
    for (const p of missingPandits) {
      console.log(`  - ${p.name} (${p.phone}) → ${p.id}.jpg`);
    }
  }
  if (failedFiles.length > 0) {
    console.log(`Failed uploads: ${failedFiles.length}`);
    for (const f of failedFiles) {
      console.log(`  - ${f}`);
    }
  }

  const expectedCount = allStablePanditIds().length;
  const hasErrors =
    unmatchedFiles.length > 0 ||
    failedFiles.length > 0 ||
    successCount !== expectedCount;

  if (hasErrors) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
