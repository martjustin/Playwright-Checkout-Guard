// pages/ProductPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {

  readonly addToCartButton:        Locator;
  readonly productName:            Locator;
  readonly cartModalMessage:       Locator;
  readonly continueShoppingButton: Locator;
  readonly viewCartInModalButton:  Locator;  // ← NEW

  constructor(page: Page) {
    super(page, '/products');

    this.addToCartButton = page.locator('button', { hasText: 'Add to cart' });

    this.productName = page.locator('.product-information h2');

    this.cartModalMessage = page.locator('#cartModal .modal-body p').first();

    this.continueShoppingButton = page.locator('button[data-dismiss="modal"]');

    // ── NEW ──────────────────────────────────────────────────────────────────
    // The "View Cart" link INSIDE the success modal.
    // This is the most reliable way to navigate to the cart after adding an item
    // because you are navigating from within the confirmed-success modal state.
    // The browser session already has the cart cookie set at this point.
    // Using cartPage.navigate() separately after continueShopping() creates
    // a race — sometimes the navigation resolves before the session cookie
    // from the add-to-cart POST request has been written.
    this.viewCartInModalButton = page.locator('#cartModal').getByRole('link', {
      name: 'View Cart'
      // getByRole('link') targets an <a> element.
      // name: 'View Cart' matches its visible text.
      // More resilient than a.href selector because it survives URL changes.
    });
  }

  async goToProductDetail(productId: number = 1): Promise<void> {
    await this.page.goto(`/product_details/${productId}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async addToCart(): Promise<void> {
    // Wait for the button to be visible and click it
    await this.addToCartButton.waitFor({ state: 'visible' });
    await this.addToCartButton.click();

    // Wait for the success modal — this confirms the server responded
    await this.cartModalMessage.waitFor({ state: 'visible' });
  }

  async goToCart(): Promise<void> {
    // ── PREFERRED navigation method after adding to cart ─────────────────────
    // Click "View Cart" INSIDE the modal.
    //
    // Why this over continueShopping() + cartPage.navigate()?
    //
    // When you call continueShopping(), you dismiss the modal and stay on
    // the product page. Then cartPage.navigate() does a fresh page.goto('/view_cart').
    // That fresh navigation sometimes lands on the cart page before the
    // add-to-cart POST response has fully committed the session cookie.
    // Result: you arrive at an empty cart.
    //
    // Clicking "View Cart" inside the modal is a user-initiated navigation
    // from within the same request lifecycle as the add-to-cart confirmation.
    // The cart cookie is already set. You arrive at a cart with your item in it.
    await this.viewCartInModalButton.waitFor({ state: 'visible' });
    await this.viewCartInModalButton.click();

    // Wait for the cart page to finish loading
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForURL('**/view_cart', { timeout: 15_000 });
    // waitForURL confirms we actually arrived at /view_cart, not that
    // we're still on the product page with a partially-loaded response.
  }

  async continueShopping(): Promise<void> {
    // Use this when you want to add MULTIPLE products and stay on-site.
    // For navigating to the cart, use goToCart() instead.
    await this.continueShoppingButton.click();
    await this.continueShoppingButton.waitFor({ state: 'hidden' });
  }

  async getProductName(): Promise<string> {
    return (await this.productName.textContent()) ?? '';
  }
}
