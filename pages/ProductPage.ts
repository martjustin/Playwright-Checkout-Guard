// pages/ProductPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  
  readonly addToCartButton:   Locator;
  readonly productName:       Locator;
  readonly productPrice:      Locator;
  readonly cartModalMessage:  Locator;
  readonly continueShoppingButton: Locator;
  readonly viewCartButton:    Locator;

  constructor(page: Page) {
    super(page, '/products');

    // ✅ These locators are on the PRODUCT DETAIL page (/product_details/1)
    // They are always visible — no hover required, works on mobile too.
    this.addToCartButton = page.locator('button[class*="cart"]').filter({
      hasText: 'Add to cart'
      // filter() narrows to the button whose text contains "Add to cart"
      // Avoids accidentally clicking a "View Cart" button with a similar class
    });

    this.productName  = page.locator('.product-information h2');
    this.productPrice = page.locator('.product-information span span');

    // The modal that appears after successfully adding to cart
    this.cartModalMessage      = page.locator('#cartModal .modal-body p').first();
    this.continueShoppingButton = page.locator('[data-dismiss="modal"]');
    this.viewCartButton        = page.locator('#cartModal a[href="/view_cart"]');
  }

  async goToProductDetail(productId: number = 1): Promise<void> {
    // Navigate directly to a product's detail page.
    // Product ID 1 always exists on automationexercise.com.
    // This avoids the hover overlay problem entirely.
    await this.page.goto(`/product_details/${productId}`);
    await this.waitForPageLoad();
  }

  async addToCart(): Promise<void> {
    // Wait for the button to be visible and enabled, then click.
    // This button is ALWAYS visible on the detail page — no hover needed.
    // Works identically on Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari.
    await this.addToCartButton.waitFor({ state: 'visible' });
    await this.addToCartButton.click();

    // Wait for the cart modal to confirm the item was added
    await this.cartModalMessage.waitFor({ state: 'visible' });
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    // Closes the "Added to cart" confirmation modal
  }

  async getProductName(): Promise<string> {
    return await this.productName.textContent() || '';
  }
}
