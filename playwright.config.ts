// playwright.config.ts
// This is Playwright's central configuration file.
// It controls: which browsers to test, timeouts, base URL, reporters, and more.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // testDir points to where your test files live
  testDir: './tests',
  
  // fullyParallel: run test FILES in parallel
  // Parallel execution means 30 tests that take 2 min sequentially take ~30 seconds
  fullyParallel: true,
  
  // forbidOnly: in CI, prevent someone from accidentally committing test.only()
  // test.only() makes only ONE test run — if committed, your CI suite goes silent
  forbidOnly: !!process.env.CI,
  // !!process.env.CI converts the env variable to a boolean
  // process.env.CI is "true" (a string) in GitHub Actions, undefined locally
  
  // retries: retry failed tests automatically
  // 2 retries in CI handles flaky tests (network blips, timing issues)
  // 0 locally so you see failures immediately while developing
  retries: process.env.CI ? 2 : 0,
  
  // workers: how many parallel test workers
  // undefined in CI lets GitHub Actions decide based on available cores
  workers: process.env.CI ? undefined : 4,
  
  // reporter: how to display results
  reporter: [
    ['html'],           // Opens a beautiful visual report: npx playwright show-report
    ['list'],           // Shows each test as it runs in the terminal
    ['junit', { outputFile: 'reports/results.xml' }],
    // JUnit XML: standard format that GitHub Actions and CI tools understand
  ],
  
  use: {
    // baseURL: you can write await page.goto('/login') instead of full URL
    baseURL: 'https://www.automationexercise.com',
    
    // trace: captures a full recording of the test (DOM, network, screenshots)
    // 'on-first-retry': only capture trace when a test fails and retries
    // Opening a trace file shows you EXACTLY what happened during failure
    trace: 'on-first-retry',
    
    // screenshot: take screenshot on test failure automatically
    screenshot: 'only-on-failure',
    
    // video: record video of test execution
    video: 'on-first-retry',
    
    // actionTimeout: max time for a single action (click, fill, etc.)
    actionTimeout: 15_000,   // 15 seconds
    
    // navigationTimeout: max time for page.goto() and similar navigations
    navigationTimeout: 30_000,  // 30 seconds
  },

  projects: [
    // Each "project" runs your entire test suite in a different browser/device
    
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // devices['Desktop Chrome'] sets a realistic viewport, user-agent, etc.
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      // webkit is Apple's browser engine — tests Safari behavior without needing a Mac
    },
    
    // Mobile viewports — critical for e-commerce (60%+ of traffic is mobile)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      // Pixel 5 viewport: 393 x 851px, touch events enabled
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
