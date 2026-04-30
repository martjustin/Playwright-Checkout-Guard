import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly path: string;

  constructor(page: Page, path: string = '/') {
    this.page = page;
    this.path = path;
  }

  async navigate(): Promise<void> {
    // waitUntil: 'domcontentloaded' fires as soon as the HTML is parsed.
    // The default 'load' waits for every ad, tracker, and third-party script
    // on automationexercise.com to finish — which causes navigation timeouts.
    // Our tests only need the DOM to be ready, not every resource loaded.
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
  }

  async waitForPageLoad(): Promise<void> {
    // domcontentloaded is faster and more reliable than networkidle on sites
    // with lots of ads. networkidle waits until zero network requests for 500ms
    // — on ad-heavy sites that almost never happens.
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: false,
    });
  }

  protected async waitAndClick(locator: Locator): Promise<void> {
    // Wait for visible, then wait for enabled, then click.
    // Three separate checks prevents "element not interactable" flakiness.
    await locator.waitFor({ state: 'visible' });
    await expect(locator).toBeEnabled();
    await locator.click();
  }
}
