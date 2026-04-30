import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? undefined : 2,

  reporter: [['html'], ['list']],

  use: {
    baseURL: 'https://www.automationexercise.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // automationexercise.com loads ads and third-party scripts that slow
    // every page. These timeouts give each action and navigation enough room.
    actionTimeout:     20_000,
    navigationTimeout: 60_000,

    // Use domcontentloaded instead of the default 'load'.
    // 'load' waits for ALL resources including ads and trackers — very slow.
    // 'domcontentloaded' fires as soon as the HTML is parsed and the DOM is ready.
    // Our locators only need the DOM — not every ad script to finish downloading.
  },

  // Global per-test timeout. The full checkout flow:
  // account creation + navigation + add-to-cart + checkout + payment + delete account
  // needs at least 90 seconds on a slow site.
  timeout: 90_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
