const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const files = [
  path.join(mobileRoot, 'components', 'TabTopHeader.tsx'),
  path.join(mobileRoot, 'components', 'custom-tab-bar.tsx'),
];
const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

if (!source.includes("from '@expo/vector-icons'")) {
  throw new Error('Navigation icons must use the cross-platform vector icon renderer.');
}

const fragileAssets = source.match(/Homepageicons\/(?:Triplebars|Home|Experts|Tools|Guidance|Profile)\.png/g) ?? [];
if (fragileAssets.length > 0) {
  throw new Error(`Navigation still references image icons: ${fragileAssets.join(', ')}`);
}

for (const icon of ['menu-outline', 'home', 'people', 'apps', 'compass', 'person']) {
  if (!new RegExp(`[\"']${icon}[\"']`).test(source)) {
    throw new Error(`Missing navigation vector icon: ${icon}`);
  }
}

console.log('Verified vector hamburger and bottom navigation icons.');
