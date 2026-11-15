import { config } from 'dotenv';
import { execSync } from 'child_process';

config();

function checkSts(label: string, accessKeyId?: string, secretAccessKey?: string): void {
  const prefix = accessKeyId?.slice(0, 4) ?? '(none)';
  if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
    console.log(`${label}: invalid — missing credentials (prefix: ${prefix})`);
    return;
  }

  try {
    const out = execSync('aws sts get-caller-identity --region ap-south-1 --output json', {
      encoding: 'utf8',
      env: {
        ...process.env,
        AWS_ACCESS_KEY_ID: accessKeyId,
        AWS_SECRET_ACCESS_KEY: secretAccessKey,
        AWS_SESSION_TOKEN: '',
      },
    });
    const identity = JSON.parse(out) as { Account?: string; Arn?: string };
    console.log(
      `${label}: valid — Account ${identity.Account}, Arn ${identity.Arn}, key prefix ${prefix}…`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const short = message.split('\n')[0] ?? message;
    console.log(`${label}: invalid — ${short} (key prefix ${prefix}…)`);
  }
}

function main(): void {
  console.log('=== AWS credential diagnosis ===\n');

  try {
    const cliOut = execSync('aws sts get-caller-identity --region ap-south-1 --output json', {
      encoding: 'utf8',
    });
    const cli = JSON.parse(cliOut) as { Account?: string; Arn?: string };
    console.log(
      `CLI default profile: valid — Account ${cli.Account}, Arn ${cli.Arn}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`CLI default profile: invalid — ${message.split('\n')[0]}`);
  }

  console.log('');
  checkSts(
    '.env AWS_ACCESS_KEY_ID',
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_ACCESS_KEY,
  );
  const primaryPrefix = process.env.AWS_ACCESS_KEY_ID?.slice(0, 4) ?? '';
  console.log(`\nPrimary AWS key prefix: ${primaryPrefix || '(none)'}`);

  console.log('\n=== Media env ===');
  for (const key of [
    'S3_MEDIA_BUCKET',
    'S3_MEDIA_REGION',
    'MEDIA_CDN_URL',
    'AVATAR_STORAGE',
  ]) {
    const value = process.env[key]?.trim();
    console.log(`${key}: ${value ? 'set' : 'MISSING'}${value ? ` (${value})` : ''}`);
  }

  const uploadReady =
    process.env.S3_MEDIA_BUCKET &&
    process.env.S3_MEDIA_REGION &&
    process.env.MEDIA_CDN_URL &&
    (process.env.AWS_ACCESS_KEY_ID !== 'local' &&
      process.env.AWS_ACCESS_KEY_ID?.trim());

  console.log(`\nUpload script can proceed: ${uploadReady ? 'yes' : 'no'}`);
}

main();
