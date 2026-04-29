// fixtures/test.fixtures.ts
// Custom Playwright fixtures extend the base `test` object.
// Think of fixtures as "dependency injection" for your tests —
// the test says what it needs, Playwright provides it.
//
// Without fixtures: every test manually creates page objects, navigates, logs in
// With fixtures: you declare `loggedInCheckoutPage` and Playwright sets it up for you

import { test as base, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { generateUser } from '../utils/test-data';

// Define the "shape" of our custom fixtures using TypeScript interfaces
// This tells TypeScript (and your IDE) what properties our custom test object has
type CustomFixtures = {
  homePage: HomePage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loggedInPage: Page;   // A page where the user is already authenticated
};

// Extend Playwright's base `test` with our custom fixtures
// From now on, all our tests import `test` from THIS file, not @playwright/test
export const test = base.extend<CustomFixtures>({
  
  homePage: async ({ page }, use) => {
    // Create a new HomePage instance using the page from the current test
    const homePage = new HomePage(page);
    
    // `use()` is how you "provide" the fixture to the test
    // Everything before use() is setup. Everything after is teardown.
    await use(homePage);
    // Nothing to teardown for a simple page object
  },
  
  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },
  
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await use(checkoutPage);
  },
  
  loggedInPage: async ({ page }, use) => {
    // This fixture provides a page where a test user is already logged in.
    // Any test that needs authentication just requests this fixture —
    // the login dance happens automatically, invisibly.
    
    const testUser = generateUser();
    
    // Navigate to register page and create account
    await page.goto('/login');
    
    // Fill signup form
    await page.locator('[data-qa="signup-name"]').fill(testUser.name);
    await page.locator('[data-qa="signup-email"]').fill(testUser.email);
    await page.locator('[data-qa="signup-button"]').click();
    
    // Fill account details
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
    
    // Wait for account creation success
    await page.waitForSelector('[data-qa="account-created"]');
    await page.locator('[data-qa="continue-button"]').click();
    
    // Page is now logged in — provide it to the test
    await use(page);
    
    // TEARDOWN: delete the account after each test that used this fixture
    // Why? To keep the sandbox clean. A fresh user for every test = true isolation.
    await page.goto('/delete_account');
    // automationexercise.com has a delete account endpoint — clean teardown
  },
});

// Re-export expect so tests only need to import from this file
export { expect };
