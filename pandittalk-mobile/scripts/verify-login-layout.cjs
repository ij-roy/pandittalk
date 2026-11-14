const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const loginSource = fs.readFileSync(path.join(mobileRoot, 'app', 'login.tsx'), 'utf8');

if (!loginSource.includes("Homepageicons/Logomain.png")) {
  throw new Error('Login must use the iOS-safe PNG logo asset.');
}

if (/mainTopPad\s*=.*windowHeight\s*\*\s*0\.15/.test(loginSource)) {
  throw new Error('Login still reserves 15% of screen height above the form.');
}

if (!/Math\.min\([^;]*32\)/s.test(loginSource)) {
  throw new Error('Login top spacing must be capped at 32 points.');
}

console.log('Verified iOS-safe login logo and height-capped login spacing.');
