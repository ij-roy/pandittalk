import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mobileTabs = readFileSync(resolve(import.meta.dirname, '../../../pandittalk-mobile/app/(tabs)/_layout.tsx'), 'utf8');
const mobileMenu = readFileSync(resolve(import.meta.dirname, '../../../pandittalk-mobile/components/SideMenu.tsx'), 'utf8');
const websiteLayout = readFileSync(resolve(import.meta.dirname, '../../src/app/(customer)/layout.tsx'), 'utf8');
const websiteNav = readFileSync(resolve(import.meta.dirname, '../../src/features/account/CustomerNav.tsx'), 'utf8');
const siteHeader = readFileSync(resolve(import.meta.dirname, '../../src/components/site/SiteHeader.tsx'), 'utf8');
const customerStyles = readFileSync(resolve(import.meta.dirname, '../../src/features/account/customer.module.css'), 'utf8');

test('both clients expose the same five primary signed-in destinations', () => {
  const labels = ['Consult', 'Experts', 'Guidance', 'Tools', 'Profile'];
  for (const label of labels) {
    if (label === 'Guidance') {
      assert.match(mobileTabs, /GUIDANCE_TAB_LABEL/);
    } else {
      assert.match(mobileTabs, new RegExp(`title: ['"]${label}['"]`), `mobile tab missing ${label}`);
    }
    assert.match(websiteNav, new RegExp(`['"]${label}['"]`), `website mobile nav missing ${label}`);
  }
  assert.match(siteHeader, /appLinks/);
  assert.match(siteHeader, /signedIn \? appLinks : publicLinks/);
});

test('secondary navigation does not repeat profile or expose a menu search', () => {
  assert.doesNotMatch(mobileMenu, /Search the menu|menuQuery|filterMenuDestinations/);
  assert.doesNotMatch(mobileMenu, /label: ['"]Profile['"]/);
  assert.match(mobileMenu, /label: ['"]Sessions['"]/);
  assert.match(mobileMenu, /label: ['"]Reports['"]/);
  assert.match(websiteLayout, /CustomerNav/);
  assert.match(websiteNav, /customerMobileNav/);
});

test('website customer navigation is mobile-only and reserves space above the fixed bar', () => {
  assert.match(customerStyles, /customerMobileNav/);
  assert.match(customerStyles, /position:\s*fixed/);
  assert.match(customerStyles, /padding-bottom:[^;]*var\(--customer-nav-height/);
});
