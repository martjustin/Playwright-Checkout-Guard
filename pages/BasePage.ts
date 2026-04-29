// pages/BasePage.ts
// Every page object inherits from this base class.
// Shared functionality so you DON'T repeat it in every page.
// This is the "Don't Repeat Yourself" principle in the form of Object Oriented Programming

import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  // Every page has access to Playwright's Page object
  // Page is the core Playwright class — it represents one browser tab
  readonly page: Page;
  
  // The URL path for this specific page (e.g., '/login', '/cart')
  // Subclasses set this in their constructor
  readonly path: string;

  constructor(page: Page, path: string = '/') {
    // page: passed in from the test — the active browser tab
    // path: the URL path this page represents
    this.page = page;
    this.path = path;
  }

  async navigate(): Promise<void> {
    // Go to this page's URL
    // Because playwright.config.ts sets baseURL, we just need the path
    // page.goto('/login') = page.goto('https://www.automationexercise.com/login')
    await this.page.goto(this.path);
  }

  async waitForPageLoad(): Promise<void> {
    // Wait until the page network is idle (no pending requests for 500ms)
    // This prevents test failures caused by checking for elements
    // before the page has fully loaded its data
    await this.page.waitForLoadState('networkidle');
  }

  async getPageTitle(): Promise<string> {
    // Returns the <title> tag content
    // Useful for verifying navigation went to the right page
    return await this.page.title();
  }

  async scrollToElement(locator: Locator): Promise<void> {
    // Scroll the element into view before interacting with it
    // Some elements are off-screen and Playwright won't click them until visible
    await locator.scrollIntoViewIfNeeded();
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    // Take a named screenshot — used for visual regression tests
    // Returns a Buffer (raw image data) that we compare against a baseline
    return await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: false,  // Just the visible viewport, not full page scroll
    });
  }

  protected async waitAndClick(locator: Locator): Promise<void> {
    // A safe click helper:
    // 1. Wait for the element to be visible
    // 2. Wait for it to be enabled (not greyed out)
    // 3. Then click
    // This prevents "Element not clickable" flakiness
    await locator.waitFor({ state: 'visible' });
    await expect(locator).toBeEnabled();
    await locator.click();
  }
}
