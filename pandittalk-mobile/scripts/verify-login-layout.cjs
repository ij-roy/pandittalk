const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const loginSource = fs.readFileSync(path.join(mobileRoot, 'app', 'login.tsx'), 'utf8');
const socialSource = fs.readFileSync(path.join(mobileRoot, 'components', 'SocialAuthButtons.tsx'), 'utf8');
const heroSource = fs.readFileSync(path.join(mobileRoot, 'components', 'premium-auth-ui.tsx'), 'utf8');

function styleBlock(source, name) {
  const match = source.match(new RegExp(`${name}: \\{([\\s\\S]*?)\\n  \\},`));
  return match?.[1] ?? '';
}

if (!loginSource.includes("Homepageicons/Logomain.png")) {
  throw new Error('Login must use the iOS-safe PNG logo asset.');
}

if (/mainTopPad\s*=.*windowHeight\s*\*\s*0\.15/.test(loginSource)) {
  throw new Error('Login still reserves 15% of screen height above the form.');
}

if (!/Math\.min\([^;]*32\)/s.test(loginSource)) {
  throw new Error('Login top spacing must be capped at 32 points.');
}

if (!loginSource.includes('Sign in or create your account.')) {
  throw new Error('Login must explain that the same flow supports sign-in and account creation.');
}

if (!loginSource.includes('create a new account or sign in to your existing PanditTalk account')) {
  throw new Error('Login must explain what the phone number does.');
}

if (!socialSource.includes('attentionProvider') || !socialSource.includes('Tap to see what is needed before social sign-in.')) {
  throw new Error('Social sign-in must animate and explain the consent requirement when pressed.');
}

if (!loginSource.includes('<BrandHero') || !loginSource.includes('compact')) {
  throw new Error('Login must opt into the compact brand hero layout.');
}

if (!heroSource.includes('compact?: boolean') || !heroSource.includes('compact &&')) {
  throw new Error('BrandHero must expose a compact layout variant for focused auth screens.');
}

if (!loginSource.includes('height: 12')) {
  throw new Error('Login must keep the primary form rhythm compact.');
}

const centeredMain = styleBlock(loginSource, 'mainAboveFooter');
if (!centeredMain.includes('flexGrow: 1') || !centeredMain.includes("justifyContent: 'center'")) {
  throw new Error('Login content must center vertically when the keyboard is hidden.');
}

const keyboardMain = styleBlock(loginSource, 'mainKeyboard');
if (!keyboardMain.includes("justifyContent: 'flex-start'")) {
  throw new Error('Login must top-anchor the content while the keyboard is open.');
}

for (const styleName of ['title', 'subtitle', 'fieldLabel', 'consentText']) {
  if (!styleBlock(loginSource, styleName).includes("textAlign: 'center'")) {
    throw new Error(`Login ${styleName} copy must be centered.`);
  }
}

if (!styleBlock(loginSource, 'authIntro').includes("alignItems: 'center'")) {
  throw new Error('Login intro must center its text block.');
}

if (!heroSource.includes('width: 104') || !heroSource.includes('height: 104') || !heroSource.includes('width: 72')) {
  throw new Error('Compact auth logo must be visibly larger.');
}

console.log('Verified direct account wording, consent-aware social feedback, iOS-safe logo, and height-capped login spacing.');
