import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
function source(relativePath: string) {
  const path = resolve(root, relativePath);
  assert.equal(existsSync(path), true, relativePath);
  return readFileSync(path, 'utf8');
}
const numerologyAssets = [
  'mulank-1-white-object-practice.webp',
  'mulank-2-daily-prayer.webp',
  'mulank-3-hug-loved-one.webp',
  'mulank-4-blue-colour-practice.webp',
  'mulank-5-sun-practice.webp',
  'mulank-6-green-token-practice.webp',
  'mulank-7-water-reminder.webp',
  'mulank-8-mirror-practice.webp',
  'mulank-9-ruby-practice.webp',
];
const campaignAssets = [
  'predict-prepare-prosper-gen-z.webp',
  'consultation-151-overview.webp',
  'voice-consultation-151-classic.webp',
  'voice-consultation-151-gen-z.webp',
];

test('all supplied campaign images are stored under clear public filenames', () => {
  for (const filename of numerologyAssets) {
    assert.equal(existsSync(resolve(root, 'public/media/numerology', filename)), true, filename);
  }
  for (const filename of campaignAssets) {
    assert.equal(existsSync(resolve(root, 'public/media/campaigns', filename)), true, filename);
  }
});

test('campaign images are placed on focused pages instead of the primary booking flow', () => {
  const tools = source('src/app/(public)/tools/page.tsx');
  const numerology = source('src/app/(public)/tools/numerology/page.tsx');
  const approach = source('src/app/(public)/our-approach/page.tsx');
  const download = source('src/app/(public)/download/page.tsx');

  assert.match(tools, /"numerology","Numerology practices"/);
  for (const filename of numerologyAssets) assert.match(numerology, new RegExp(filename));
  assert.match(approach, /predict-prepare-prosper-gen-z\.webp/);
  for (const filename of campaignAssets.slice(1)) assert.match(download, new RegExp(filename));
});
