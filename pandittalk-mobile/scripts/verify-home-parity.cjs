const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(mobileRoot, 'app', '(tabs)', 'index.tsx'), 'utf8');

for (const phrase of [
  'Talk to a verified Pandit',
  'Browse Pandits',
  'Chat Now',
  'Book chat, audio or video',
  'What would you like to discuss?',
  'Helpful reading',
  'Optional self-service tools',
  'Search journal articles',
]) {
  if (!source.includes(phrase)) {
    throw new Error(`Mobile authenticated home is missing shared phrase: ${phrase}`);
  }
}

for (const destination of ["router.push('/experts')", "router.push('/articles')", "router.push(item.route)"]) {
  if (!source.includes(destination)) {
    throw new Error(`Mobile authenticated home is missing shared destination: ${destination}`);
  }
}

console.log('Verified mobile authenticated-home parity contract.');
