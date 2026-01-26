import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Disable full parallelization to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry flaky tests once locally too
  workers: 1, // Run tests serially to avoid backend/state conflicts
  reporter: 'html',

  // Fast timeouts for fast apps! Backend and Vite are blazing fast.
  timeout: 15000, // 15s per test (default: 30s)

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Aggressive timeouts - if something takes >5s, it's a real problem
    actionTimeout: 5000, // Clicks, fills, etc
    navigationTimeout: 10000, // Page loads
  },

  expect: {
    timeout: 5000, // Assertions (element visibility, etc)
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Disabled firefox/webkit for speed - enable when needed for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
