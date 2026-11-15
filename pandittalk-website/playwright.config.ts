import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  // Next dev's Turbopack compiler shares manifests across workers. A single
  // worker keeps the route checks deterministic and avoids transient 500s.
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'output/ui-report', open: 'never' }]],
  outputDir: 'output/ui-results',
  use: {
    baseURL: process.env.UI_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.UI_BASE_URL ? undefined : {
    command: 'node tests/start-test-server.cjs',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
