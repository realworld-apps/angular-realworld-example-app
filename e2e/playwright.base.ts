import { type PlaywrightTestConfig, devices } from '@playwright/test';

/**
 * Base Playwright configuration for RealWorld e2e tests.
 *
 * Implementations should extend this in their root playwright.config.ts:
 *
 * ```ts
 * import { defineConfig } from '@playwright/test';
 * import { baseConfig } from './e2e/playwright.base';
 *
 * export default defineConfig({
 *   ...baseConfig,
 *   use: { ...baseConfig.use, baseURL: 'http://localhost:3000' },
 *   webServer: {
 *     command: 'npm run start',
 *     url: 'http://localhost:3000',
 *     reuseExistingServer: !process.env.CI,
 *     timeout: 120_000,
 *   },
 * });
 * ```
 */
export const baseConfig: PlaywrightTestConfig = {
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',

  timeout: 15_000,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },

  expect: {
    timeout: 5_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
};
