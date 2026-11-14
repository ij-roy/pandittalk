const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const sourceFiles = [
  path.join(mobileRoot, 'app', '(tabs)', 'index.tsx'),
  path.join(mobileRoot, 'app', '(tabs)', 'tools.tsx'),
];

const source = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const svgReferences = source.match(/Homepageicons\/[^'\"]+\.svg/g) ?? [];
if (svgReferences.length > 0) {
  throw new Error(`Guidance/tool tiles still reference iOS-fragile SVG assets: ${svgReferences.join(', ')}`);
}

const requiredPngs = [
  'CareerBusiness.png', 'LoveRelationships.png', 'FinanceWealth.png',
  'MarriageFamily.png', 'LegalAdvice.png', 'HealthWellbeing.png',
  'LifePath.png', 'SpiritualProtection.png', 'BasicKundli.png',
  'DailyHoroscope.png', 'CompatibilityCheck.png', 'Palmistry.png',
];
const iconDir = path.join(mobileRoot, 'assets', 'images', 'Homepageicons');
for (const file of requiredPngs) {
  if (!fs.existsSync(path.join(iconDir, file))) {
    throw new Error(`Missing iOS-safe tile icon: ${file}`);
  }
}

console.log(`Verified ${requiredPngs.length} guidance/tool PNG assets and no SVG tile references.`);
