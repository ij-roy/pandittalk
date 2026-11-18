const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(mobileRoot, 'app', '(tabs)', 'index.tsx'), 'utf8');
const expertsSource = fs.readFileSync(path.join(mobileRoot, 'app', '(tabs)', 'experts.tsx'), 'utf8');

for (const label of [
  'Career &\\nBusiness',
  'Love &\\nRelationships',
  'Finance &\\nWealth',
  'Marriage &\\nFamily',
  'Health &\\nWellbeing',
  'Spiritual\\nProtection',
]) {
  if (!source.includes(label)) {
    throw new Error(`Mobile home is missing supported topic label: ${label.replace(/\\n/g, ' / ')}`);
  }
}

for (const required of ['fetchExperts', 'Available now', 'router.push(`/experts/${']) {
  if (!source.includes(required)) {
    throw new Error(`Mobile home is missing real-data Pandit preview contract: ${required}`);
  }
}

for (const removed of ['SearchBar', 'Search consultation topics and experts', 'Legal Advice', 'Life Path']) {
  if (source.includes(removed)) {
    throw new Error(`Mobile home still contains removed home content: ${removed}`);
  }
}

for (const removed of ['legal_advice', 'life_path', 'Legal Advice', 'Life Path']) {
  if (expertsSource.includes(removed)) {
    throw new Error(`Experts screen still exposes removed category: ${removed}`);
  }
}

console.log('Verified mobile home first-screen contract.');
