import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: false }) });
  });
  await page.route('**/api/backend/experts**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
});

test('homepage hero leads with value, two choices and a useful guide', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a calmer next step for the question on your mind.');
  await expect(page.locator('.hero-brand')).toHaveCount(0);
  await expect(page.locator('.hero-copy > .button')).toHaveCount(1);
  await expect(page.locator('.hero-copy > .button')).toHaveText(/Explore Pandits/);
  await expect(page.locator('.home-draft-note .text-link')).toHaveText(/Write a private draft/);
  await expect(page.locator('.hero-guide-card')).toBeVisible();
  await expect(page.locator('.hero-trust-list li')).toHaveCount(4);
  await expect(page.locator('.hero .notify-open-form')).toHaveCount(0);
  await expect(page.locator('.home-page .eyebrow')).toHaveCount(0);
  await expect(page.locator('.site-footer .eyebrow')).toHaveCount(0);
});

test('homepage explains the first-time visitor path in concrete language', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Choose a topic, compare Pandit profiles, and see what feels right before deciding whether to talk.', { exact: true })).toBeVisible();
  await expect(page.getByText('It stays in this browser, is not shared with a Pandit, and does not create a booking.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with what feels closest.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'See who you may speak with.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with a reading or a tool.', exact: true })).toBeVisible();
});

test('homepage asks for an email once, after explaining the service', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.home-update .notify-open-form')).toHaveCount(1);
  await expect(page.locator('.home-page .notify-open-form')).toHaveCount(1);
  const updateTop = await page.locator('.home-update').evaluate(element => element.getBoundingClientRect().top);
  expect(updateTop).toBeGreaterThan(await page.evaluate(() => innerHeight));
  await expect(page.locator('.home-page')).not.toContainText(/no timer|countdown|minute-by-minute/i);
});

test('homepage does not look unfinished while the Pandit API is unavailable', async ({ page }) => {
  await page.route('**/api/backend/experts**', async route => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/');
  await expect(page.getByText('Finding Pandits…', { exact: true })).toHaveCount(0);
  await expect(page.locator('.expert-row-skeleton')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Explore Pandit profiles/i })).toBeVisible();
});

test('homepage enhancement remains decorative and motion-aware', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('.reveal-on-scroll').first()).toBeVisible();
  await expect(page.locator('.spotlight-card')).toHaveCount(3);
  await expect(page.locator('.hero-orbit-art')).toHaveAttribute('aria-hidden', 'true');
  const motion = await page.locator('.hero-orbit-art').evaluate(element => {
    const ring = element.querySelector('.hero-orbit-ring');
    return ring ? getComputedStyle(ring).animationName : null;
  });
  expect(motion).toBe('none');
});

test('homepage hero uses a calm decorative aurora with a reduced-motion fallback', async ({ page }) => {
  await page.goto('/');

  const aurora = page.locator('.hero-aurora');
  await expect(aurora).toHaveCount(1);
  await expect(aurora).toHaveAttribute('aria-hidden', 'true');
  await expect(aurora.locator('canvas.hero-aurora-canvas')).toHaveCount(1);
  await expect(aurora.locator('.hero-aurora-fallback')).toHaveCount(1);
  await expect(aurora).toHaveAttribute('data-aurora-engine', /^(webgl|fallback)$/);
  await expect.poll(async () => aurora.locator('canvas').evaluate(element => ({ width: element.width, height: element.height }))).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
  expect(await aurora.getAttribute('data-aurora-running')).toBe('true');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.hero-aurora')).toHaveAttribute('data-aurora-running', 'false');
});

test('homepage avoids decorative eyebrow labels that compete with its message', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.home-page .eyebrow')).toHaveCount(0);
  await expect(page.locator('.site-footer .eyebrow')).toHaveCount(0);
});

test('footer introduces Pandit Talk with one clear next step', async ({ page }) => {
  await page.goto('/');

  const footer = page.locator('.site-footer');
  await expect(footer.locator('.footer-brand-link')).toHaveAttribute('aria-label', 'Pandit Talk home');
  await expect(footer.getByText('Guidance, tools, and Pandit profiles in one calm place.', { exact: true })).toBeVisible();
  await expect(footer.getByRole('heading', { name: 'Choose where to begin.', exact: true })).toHaveCount(0);
  await expect(footer.locator('.footer-actions .button')).toHaveCount(1);
  await expect(footer.getByRole('link', { name: 'Prepare a draft', exact: true })).toHaveCount(0);
});

test('footer balances legal links and groups utility content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const footer = page.locator('.site-footer');
  const legalColumns = await footer.locator('.footer-nav-group--legal .footer-nav__items').evaluate(element => {
    return getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length;
  });

  expect(legalColumns).toBe(2);
  await expect(footer.locator('.footer-utility-row .footer-copyright')).toBeVisible();
  await expect(footer.locator('.footer-utility-row .footer-back-top')).toBeVisible();
  await expect(footer.locator('.footer-policy-row .footer-disclaimer')).toBeVisible();
});

test('footer navigation collapses into readable groups on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const footer = page.locator('.site-footer');
  const firstGroup = footer.locator('.footer-nav-group').first();
  await expect(firstGroup.locator('summary')).toHaveText('Discover');
  await expect(firstGroup.locator('nav')).not.toBeVisible();

  await firstGroup.locator('summary').click();
  await expect(firstGroup.locator('nav')).toBeVisible();
  await expect(firstGroup.getByRole('link', { name: 'Explore Pandits', exact: true })).toBeVisible();
  const linkHeights = await firstGroup.locator('nav a').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).minHeight)));
  expect(linkHeights.every(height => height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('footer navigation remains expanded on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const footer = page.locator('.site-footer');
  await expect(footer.locator('.footer-nav-group').first().getByRole('link', { name: 'Explore Pandits', exact: true })).toBeVisible();
});

test('homepage reveal content cannot remain hidden indefinitely', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2200);

  const hidden = await page.locator('.reveal-on-scroll').evaluateAll(elements => elements.filter(element => element.getAttribute('data-reveal-visible') !== 'true').length);
  expect(hidden).toBe(0);
});

test('normal homepage content does not expose keyboard implementation instructions', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#home-faq-hint')).toHaveClass(/sr-only/);
  await expect(page.getByText('Press Escape to leave this region.', { exact: true })).toHaveCount(0);
});

test('header keeps a useful guest path while session checking is slow', async ({ page }) => {
  await page.route('**/api/auth/session', async route => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: false }) });
  });

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible({ timeout: 1000 });
  await expect(page.getByText('Checking session…', { exact: true })).toHaveCount(0);
});

test('slow Pandit loading offers a next step instead of a silent skeleton', async ({ page }) => {
  await page.route('**/api/backend/experts**', async route => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/pandits');
  await expect(page.getByText('Still loading? You can use free tools or prepare a draft while profiles load.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('While Pandit results load').getByRole('link', { name: 'Try free tools', exact: true })).toBeVisible();
});

test('guidance uses plain-language steps and stores the draft in the browser', async ({ page }) => {
  await page.goto('/guidance/start');

  await expect(page.getByRole('button', { name: '3. What to expect', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '3. No Timer status', exact: true })).toHaveCount(0);
  await page.getByLabel('Where would you like guidance?').selectOption('career');
  await page.getByRole('button', { name: '2. Your question', exact: true }).click();
  await page.getByLabel('Your question or context (optional)').fill('A question I want to think through.');

  await expect(page.getByText(/Draft notes stay in this browser\./)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => Boolean(localStorage.getItem('pandittalk.guidance.draft')))).toBe(true);
});

test('tool pages explain privacy before collecting sensitive details', async ({ page }) => {
  await page.goto('/tools/palm-reading');

  await expect(page.getByRole('link', { name: 'Privacy policy', exact: true })).toBeVisible();
  await expect(page.getByText('This page does not save a copy on your device unless you choose to.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Left palm photo')).toHaveAttribute('capture', 'environment');
});

test('a completed reading can be saved locally and restored on return', async ({ page }) => {
  await page.route('**/api/backend/tools/horoscope', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sign: 'aries', todayInsight: 'Make room for a small useful step.', luckyColor: 'Ochre', luckyTime: 'Morning' }),
    });
  });

  await page.goto('/tools/horoscope');
  await page.getByRole('button', { name: 'Aries', exact: true }).click();
  await page.getByRole('button', { name: 'Get free reading', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your reading', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save this reading on this browser', exact: true }).click();
  await expect(page.getByText('Saved on this browser. Only this device can access this copy until you remove it.', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('Saved reading restored from this browser.', { exact: true })).toBeVisible();
  await expect(page.getByText('Make room for a small useful step.', { exact: true })).toBeVisible();
});

test('sign-in leads with the private-space value before availability caveats', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Sign in to your private space.', exact: true })).toBeVisible();
  await expect(page.getByLabel('Indian mobile number (+91)')).toBeVisible();
  await expect(page.locator('.auth-availability')).toBeVisible();
  await expect(page.locator('.auth-availability').evaluate(node => node.compareDocumentPosition(document.querySelector('.auth-panel')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
});

test('policy pages keep keyboard guidance out of the visible mobile reading flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/privacy');

  await expect(page.locator('#legal-tabs-hint')).toHaveClass(/sr-only/);
  await expect(page.getByText(/Swipe sideways on small screens to see every policy\./)).toHaveCount(0);
});

test('shared site palette uses a bright gold-led brand across the shell and discovery choices', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const colors = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const primary = document.querySelector('.hero-copy > .button')!;
    const topic = document.querySelector('.topic-links a')!;
    const footer = document.querySelector('.site-footer')!;

    return {
      gold: root.getPropertyValue('--brand-gold').trim(),
      goldDeep: root.getPropertyValue('--brand-gold-deep').trim(),
      olive: root.getPropertyValue('--brand-olive-dark').trim(),
      primary: getComputedStyle(primary).backgroundColor,
      topic: getComputedStyle(topic).backgroundColor,
      footer: getComputedStyle(footer).backgroundColor,
    };
  });

  expect(colors).toEqual({
    gold: '#e7b63f',
    goldDeep: '#865713',
    olive: '#43543d',
    primary: 'rgb(231, 182, 63)',
    topic: 'rgb(255, 241, 203)',
    footer: 'rgb(246, 239, 222)',
  });
});

test('journal opens at its introduction instead of jumping to the empty result', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/articles');
  await expect(page.locator('.journal-hero h1')).toBeVisible();
  await page.waitForTimeout(500);

  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('journal touch hint stays concise while keyboard instructions remain screen-reader only', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/articles');

  await expect(page.locator('#journal-category-hint')).toHaveClass(/sr-only/);
  await expect(page.locator('.journal-category-scroll-hint')).toHaveText('Swipe to explore more categories.');
});

test('empty journal offers three relevant destinations without keyboard-only copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/articles');

  const empty = page.locator('.journal-empty');
  await expect(empty.getByRole('heading', { name: 'No published articles yet.', exact: true })).toBeVisible();
  await expect(empty.locator('.actions a')).toHaveText([
    'Browse guidance topics',
    'Try a free tool',
    'Explore Pandits →',
  ]);
  await expect(empty.getByText(/Press Escape to leave this notice\./)).toHaveCount(0);
});

test('homepage ambience fades cleanly at container edges on mobile and desktop', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const masks = await page.evaluate(() => ({
      pageGlow: getComputedStyle(document.querySelector('.home-page')!, '::before').maskImage,
      heroGlow: getComputedStyle(document.querySelector('.hero-aurora')!).maskImage,
    }));

    expect(masks.pageGlow).toMatch(/to right/);
    expect(masks.heroGlow).toMatch(/to right/);
  }
});

test('tools page keeps keyboard implementation help out of the visible reading flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools');

  await expect(page.locator('#free-tools-hint')).toHaveText('Free automated tools. No booking required, and nothing here charges your wallet.');
  await expect(page.locator('#free-tools-hint')).not.toContainText('Arrow keys');
  await expect(page.locator('#free-tools-hint')).not.toContainText('Skip remains site-content');
  await expect(page.locator('#free-tools-keyboard-hint')).toHaveClass(/sr-only/);
  await expect(page.locator('#paused-tools-hint')).not.toContainText('Arrow keys');
  await expect(page.locator('#paused-tools-keyboard-hint')).toHaveClass(/sr-only/);
});

test('directory, help search, and sign-in keep keyboard shortcuts out of visible helper copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/pandits');
  await expect(page.locator('.filters-toolbar > .expert-meta')).not.toContainText('Press Escape');

  await page.goto('/help');
  await expect(page.locator('.help-search > p[role="status"]')).toHaveText('9 topics · browse or type to filter.');
  await expect(page.locator('.help-search > p[role="status"]')).not.toContainText('Press Escape');

  await page.goto('/login');
  await expect(page.locator('#phone-help')).not.toContainText('Press Escape');
});

test('help availability notice stacks its email form on small screens', async ({ page }) => {
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/help');
    await expect(page.locator('.offer-notice')).toBeVisible();

    const widths = await page.locator('.offer-notice').evaluate(node => {
      const notice = node.getBoundingClientRect();
      const form = node.querySelector('.notify-open-form')!.getBoundingClientRect();
      return { notice: notice.width, form: form.width, direction: getComputedStyle(node).flexDirection };
    });

    expect(widths.direction).toBe('column');
    expect(widths.form).toBeGreaterThan(widths.notice * 0.75);
  }
});

test('private guidance draft opens at its introduction before focusing the first step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/guidance/start');
  await page.waitForTimeout(600);

  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('#guidance-step-title')).not.toBeFocused();
});

test('practitioner application keeps keyboard shortcuts out of visible field guidance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/for-pandits');

  for (const id of ['application-phone', 'application-languages', 'application-message-help']) {
    await expect(page.locator(`#${id}`)).not.toContainText('Press Escape');
    await expect(page.locator(`#${id}-keyboard-hint`)).toHaveClass(/sr-only/);
  }
});

test('interactive tools keep keyboard implementation help out of visible instructions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/tools/kundli');
  for (const id of ['dob-help', 'tob-help', 'coordinates-help']) {
    await expect(page.locator(`#${id}`)).not.toContainText('Press Escape');
    await expect(page.locator(`#${id}-keyboard-hint`)).toHaveClass(/sr-only/);
  }

  await page.goto('/tools/horoscope');
  await expect(page.locator('.expert-meta[role="status"]')).not.toContainText(/Arrow keys|Press Escape/);

  await page.goto('/tools/palm-reading');
  await expect(page.locator('#palm-photo-help')).not.toContainText('Press Escape');
  await expect(page.locator('#palm-photo-keyboard-hint')).toHaveClass(/sr-only/);

  await page.goto('/tools/tarot');
  await expect(page.locator('.expert-meta[role="status"]')).not.toContainText(/Arrow keys|Press Escape/);
});

test('login keeps social sign-in copy and brand marks consistent', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');

  await expect(page.locator('#social-consent-help')).toContainText('Phone sign-in remains available without this checkbox.');
  await expect(page.getByText('Needed for Google or Apple.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in with Google', exact: true })).toHaveCount(0);

  await expect(page.locator('[data-provider="apple"] [data-brand-logo="apple"]')).toBeVisible();
  await expect(page.locator('[data-provider="google"] [data-brand-logo="google"]')).toBeVisible();
});
