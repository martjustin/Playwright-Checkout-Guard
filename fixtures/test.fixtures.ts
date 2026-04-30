import { test as base, expect, Page } from '@playwright/test';
import { HomePage }     from '../pages/HomePage';
import { CartPage }     from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { generateUser } from '../utils/test-data';

type CustomFixtures = {
  homePage:      HomePage;
  cartPage:      CartPage;
  checkoutPage:  CheckoutPage;
  loggedInPage:  Page;
};

export const test = base.extend<CustomFixtures>({

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  loggedInPage: async ({ page }, use) => {

    // ── SETUP ────────────────────────────────────────────────────────────────
    const testUser = generateUser();

    // Navigate with domcontentloaded — don't wait for ads
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Fill signup section (right column of the /login page)
    await page.locator('[data-qa="signup-name"]').fill(testUser.name);
    await page.locator('[data-qa="signup-email"]').fill(testUser.email);
    await page.locator('[data-qa="signup-button"]').click();

    // Account details form
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#id_gender1').check();
    await page.locator('[data-qa="password"]').fill(testUser.password);
    await page.locator('[data-qa="first_name"]').fill(testUser.firstName);
    await page.locator('[data-qa="last_name"]').fill(testUser.lastName);
    await page.locator('[data-qa="address"]').fill(testUser.address);
    await page.locator('[data-qa="country"]').selectOption('United States');
    await page.locator('[data-qa="state"]').fill(testUser.state);
    await page.locator('[data-qa="city"]').fill(testUser.city);
    await page.locator('[data-qa="zipcode"]').fill(testUser.zipcode);
    await page.locator('[data-qa="mobile_number"]').fill(testUser.phone);
    await page.locator('[data-qa="create-account"]').click();

    // Wait for the "Account Created!" confirmation
    await page.waitForSelector('[data-qa="account-created"]', { timeout: 20_000 });
    await page.locator('[data-qa="continue-button"]').click();
    await page.waitForLoadState('domcontentloaded');

    // ── HAND OFF to the test ─────────────────────────────────────────────────
    await use(page);

    // ── TEARDOWN ─────────────────────────────────────────────────────────────
    // Wrapped in try/catch because:
    //   1. If the test timed out, the page may already be closed or navigating.
    //   2. A teardown crash would mask the real test failure in the report.
    //   3. We log a warning so the sandbox account isn't silently left behind.
    try {
      await page.goto('/delete_account', {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      });
      // automationexercise.com deletes the account when you navigate to this URL.
      // No button click required — the page itself triggers deletion.
    } catch {
      console.warn(
        `[TEARDOWN] Could not delete account for ${testUser.email}. ` +
        `This is usually because the test timed out before teardown ran. ` +
        `The account will remain in the sandbox — no real data at risk.`
      );
    }
  },
});

export { expect };
