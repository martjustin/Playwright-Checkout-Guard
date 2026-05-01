import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly logo: Locator;
  readonly productsLink: Locator;

  constructor(page: Page) {
    super(page, '/');
    this.logo = page.locator('img[alt="Website for automation practice"]');
    this.productsLink = page.getByRole('link', { name: 'Products' });
  }

  async goToProducts(): Promise<void> {
    await this.waitAndClick(this.productsLink);
    await this.waitForPageLoad();
  }
}
