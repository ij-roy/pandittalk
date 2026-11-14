import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getAllowedWebViewHosts,
  isAllowedWebViewNavigation,
  resolveAllowedWebViewUrl,
} from './webviewAllowlist.ts';

describe('getAllowedWebViewHosts', () => {
  it('includes production www and apex by default', () => {
    const hosts = getAllowedWebViewHosts('https://www.pandittalk.com');
    assert.ok(hosts.includes('www.pandittalk.com'));
    assert.ok(hosts.includes('pandittalk.com'));
  });

  it('adds host from custom legal base', () => {
    const hosts = getAllowedWebViewHosts('https://legal.example.test/base');
    assert.ok(hosts.includes('legal.example.test'));
  });
});

describe('resolveAllowedWebViewUrl', () => {
  const hosts = ['www.pandittalk.com', 'pandittalk.com'] as const;
  const fallback = 'https://www.pandittalk.com/privacy';

  it('accepts real privacy/terms HTTPS URLs', () => {
    const privacy = resolveAllowedWebViewUrl(
      'https://www.pandittalk.com/privacy',
      fallback,
      hosts,
    );
    assert.equal(privacy.ok, true);
    if (privacy.ok) {
      assert.equal(privacy.url, 'https://www.pandittalk.com/privacy');
    }

    const terms = resolveAllowedWebViewUrl(
      'https://www.pandittalk.com/terms-and-conditions',
      fallback,
      hosts,
    );
    assert.equal(terms.ok, true);
  });

  it('rejects example.com and other arbitrary hosts', () => {
    const bad = resolveAllowedWebViewUrl(
      'https://example.com/privacy-policy',
      fallback,
      hosts,
    );
    assert.equal(bad.ok, false);

    const phishing = resolveAllowedWebViewUrl(
      'https://evil.example/phish',
      fallback,
      hosts,
    );
    assert.equal(phishing.ok, false);
  });

  it('rejects http and malformed URLs', () => {
    assert.equal(
      resolveAllowedWebViewUrl('http://www.pandittalk.com/privacy', fallback, hosts)
        .ok,
      false,
    );
    assert.equal(resolveAllowedWebViewUrl('not a url', fallback, hosts).ok, false);
  });

  it('uses validated fallback when raw is empty', () => {
    const res = resolveAllowedWebViewUrl('', fallback, hosts);
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.url, fallback);
  });

  it('fails when both raw and fallback are disallowed', () => {
    const res = resolveAllowedWebViewUrl(
      'https://evil.test',
      'https://also-evil.test',
      hosts,
    );
    assert.equal(res.ok, false);
  });
});

describe('isAllowedWebViewNavigation', () => {
  const hosts = ['www.pandittalk.com'] as const;

  it('allows in-site navigation and blocks off-site', () => {
    assert.equal(
      isAllowedWebViewNavigation('https://www.pandittalk.com/help', hosts),
      true,
    );
    assert.equal(
      isAllowedWebViewNavigation('https://attacker.test/login', hosts),
      false,
    );
  });
});
