const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const homeSource = fs.readFileSync(path.join(mobileRoot, 'app', '(tabs)', 'index.tsx'), 'utf8');
const articleSource = fs.readFileSync(path.join(mobileRoot, 'components', 'ArticleCard.tsx'), 'utf8');

function assertIncludes(source, value) {
  if (!source.includes(value)) {
    throw new Error(`Expected source to contain: ${value}`);
  }
}

function assertNotIncludes(source, value) {
  if (source.includes(value)) {
    throw new Error(`Expected source not to contain: ${value}`);
  }
}

function assertOrder(source, before, after) {
  const beforeIndex = source.indexOf(before);
  const afterIndex = source.indexOf(after);
  if (beforeIndex < 0 || afterIndex < 0 || beforeIndex >= afterIndex) {
    throw new Error(`Expected "${before}" to appear before "${after}".`);
  }
}

assertNotIncludes(homeSource, 'Optional self-service tools');
assertOrder(homeSource, 'Self-service tools', 'Latest');
assertIncludes(homeSource, 'marginTop: 32');
assertIncludes(articleSource, 'Curated guidance for everyday questions');
assertIncludes(articleSource, 'min read');
assertIncludes(articleSource, 'articleCategoryLabel(article.category)');
assertIncludes(articleSource, 'Animated');
assertIncludes(articleSource, 'authorAvatar');

console.log('Verified Instagram-style article feed layout contract.');
