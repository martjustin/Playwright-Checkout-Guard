// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? undefined : 4,

  reporter: [['html'], ['list']],

  use: {
    baseURL: 'https://www.automationexercise.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // ✅ FIX: 30s was too tight for a flow that creates an account,
    // navigates multiple pages, fills forms, and deletes the account.
    // 60s gives the full flow breathing room on all browsers.
    actionTimeout:     15_000,
    navigationTimeout: 45_000,
  },

  // ✅ FIX: Set a global test timeout of 90s.
  // Individual tests can override this with test.setTimeout() if needed.
  timeout: 90_000,

  projects: [
    { name: 'chromium',      use: { ...devices['Desktop Chrome']  } },
    { name: 'firefox',       use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',        use: { ...devices['Desktop Safari']  } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5']         } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14']       } },
  ],
});
