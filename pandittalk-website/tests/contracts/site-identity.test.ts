import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SiteFooter } from '../../src/components/site/SiteFooter';
import AboutPage from '../../src/app/(public)/about/page';
import ContactPage from '../../src/app/(public)/contact/page';

const organizationName = 'Personal Astrology Numerology Directional Info Talk Tech Private Limited';
const supportEmail = 'admininfo@pandittalk.com';
(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('public identity pages associate Pandit Talk with its legal organization', () => {
  for (const component of [SiteFooter, AboutPage, ContactPage]) {
    const html = renderToStaticMarkup(React.createElement(component));
    assert.match(html, new RegExp(organizationName));
  }
});

test('public support surfaces use the staffed organization email', () => {
  for (const component of [SiteFooter, ContactPage]) {
    const html = renderToStaticMarkup(React.createElement(component));
    assert.match(html, new RegExp(`mailto:${supportEmail}`));
    assert.doesNotMatch(html, /support@pandittalk\.com/);
  }
});
