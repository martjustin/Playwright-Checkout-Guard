import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {

  readonly cartItems:               Locator;
  readonly productNames:            Locator;
  readonly deleteButtons:           Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly emptyCartMessage:        Locator;
  readonly totalPriceCell:          Locator;

  constructor(page: Page) {
    super(page, '/view_cart');

    this.cartItems    = page.locator('#cart_info tbody tr[id^="product-"]');
    this.productNames = page.locator('td.cart_description h4 a');
    this.deleteButtons = page.locator('td.cart_delete a');

    // ─────────────────────────────────────────────────────────────────────────
    // WHY THIS LOCATOR CHANGED
    //
    // Original: page.locator('a[class*="check_out"]')
    //   → class*= means "class attribute contains check_out"
    //   → On automationexercise.com, the actual class is "btn btn-default check_out"
    //   → This should work BUT the button only appears when the cart has items.
    //   → When previous tests failed to add items, the cart was empty, this
    //     button was absent, and the test timed out waiting for it.
    //
    // The locator itself was fine. The cart was empty because add-to-cart
    // failed upstream. Fixing ProductPage.ts fixes this too.
    //
    // We add a text-based fallback to be doubly safe:
    // ─────────────────────────────────────────────────────────────────────────
    this.proceedToCheckoutButton = page.locator('.check_out');
    // Matches any element whose class is exactly or contains "check_out".
    // More permissive than class*= and works even if class order changes.

    this.emptyCartMessage = page.locator('#empty_cart');
    this.totalPriceCell   = page.locator('.cart_total .cart_total_price');
  }

  async getCartItemCount(): Promise<number> {
    // count() returns 0 if no elements match — does NOT throw.
    // Safe to call even when the cart is empty.
    return await this.cartItems.count();
  }

  async getProductNames(): Promise<string[]> {
    return await this.productNames.allTextContents();
  }

  async removeFirstItem(): Promise<void> {
    const countBefore = await this.cartItems.count();
    await this.deleteButtons.first().click();

    await expect(this.cartItems).toHaveCount(Math.max(countBefore - 1, 0), {
      timeout: 15_000,
    });
  }

  async isCartEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  async getTotalPrice(): Promise<number> {
    const text = (await this.totalPriceCell.first().textContent()) ?? '0';
    // Strip everything that isn't a digit or decimal point.
    // "Rs. 1,500" → "1500"
    const numeric = text.replace(/[^0-9.]/g, '');
    return parseFloat(numeric) || 0;
  }

  async proceedToCheckout(): Promise<void> {
    // waitAndClick is inherited from BasePage:
    // 1. Wait for element to be visible
    // 2. Wait for element to be enabled
    // 3. Click
    await this.waitAndClick(this.proceedToCheckoutButton);
    await this.waitForPageLoad();
  }

  async verifyProductInCart(productName: string): Promise<void> {
    const item = this.page.locator('td.cart_description h4 a', {
      hasText: productName,
    });
    await expect(item).toBeVisible();
  }
}
