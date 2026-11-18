import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const homeSource = readFileSync(resolve(import.meta.dirname, '../../src/features/account/HomeOverview.tsx'), 'utf8');
const homeStyles = readFileSync(resolve(import.meta.dirname, '../../src/features/account/customer.module.css'), 'utf8');

test('authenticated website home follows the mobile consultation and reading order', () => {
  const order = [
    'homeConsultHero',
    'homePrimaryActions',
    'homeTopicSection',
    'homeReadingSection',
    'homeToolsSection',
    'homeLatest',
  ];
  let previous = -1;
  for (const label of order) {
    const index = homeSource.indexOf(label);
    assert.notEqual(index, -1, `missing home section: ${label}`);
    assert.ok(index > previous, `${label} is out of order`);
    previous = index;
  }
  assert.match(homeSource, /Talk to a verified pandit/);
  assert.match(homeSource, /Chat Now/);
  assert.match(homeSource, /Book chat, audio or video/);
  assert.match(homeSource, /What would you like to discuss\?/);
  assert.match(homeSource, /Helpful reading/);
  assert.match(homeSource, /Self-service tools/);
  assert.match(homeSource, /Latest/);
  assert.doesNotMatch(homeSource, /Optional self-service tools/);
  assert.match(homeSource, /Curated guidance for everyday questions/);
  assert.match(homeSource, /Guidance from the PanditTalk community/);
  assert.match(homeSource, /min read/);
});

test('website home gives the article feed a responsive 32px section separation', () => {
  assert.match(homeStyles, /homeLatest[^\n]*margin-top:\s*32px/);
  assert.match(homeStyles, /homeArticlePost/);
  assert.match(homeStyles, /prefers-reduced-motion/);
  assert.match(homeStyles, /max-width:\s*900px/);
  assert.match(homeStyles, /max-width:\s*620px/);
});
