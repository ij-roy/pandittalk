const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(mobileRoot, ...parts), 'utf8');

const progressCard = read('components', 'ProfileProgressCard.tsx');
if (!progressCard.includes('<ScrollView') || !progressCard.includes('horizontal')) {
  throw new Error('Profile milestones must use a single horizontal scroll rail.');
}
if (progressCard.includes("flexWrap: 'wrap'")) {
  throw new Error('Profile milestones still wrap onto multiple rows.');
}
const usesReducedMotion = progressCard.includes('ReduceMotion.System')
  || (progressCard.includes('AccessibilityInfo.isReduceMotionEnabled') && progressCard.includes('reduceMotionChanged'));
if (!usesReducedMotion || !progressCard.includes('withTiming')) {
  throw new Error('Profile progress animation must respect the system reduced-motion setting.');
}

const walletCluster = read('components', 'WalletCluster.tsx');
if (!walletCluster.includes("name=\"wallet-outline\"") || walletCluster.includes('Wallet.png')) {
  throw new Error('Header wallet must use the reliable vector icon renderer.');
}

for (const screen of ['link-phone.tsx', 'verify-otp.tsx']) {
  const source = read('app', screen);
  if (source.includes('Logomain.svg') || !source.includes('Logomain.png')) {
    throw new Error(`${screen} must use the iOS-safe PNG brand asset.`);
  }
}

console.log('Verified compact animated profile rail and iOS-safe remaining UI icons.');
