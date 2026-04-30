import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {

  readonly addToCartButton:        Locator;
  readonly productName:            Locator;
  readonly productPrice:           Locator;
  readonly cartModalMessage:       Locator;
  readonly continueShoppingButton: Locator;
  readonly viewCartButton:         Locator;

  constructor(page: Page) {
    // Path set to /products as the landing page, but most interactions
    // happen on /product_details/:id where buttons are always visible.
    super(page, '/products');

    // ─────────────────────────────────────────────────────────────────────────
    // WHY THIS LOCATOR AND NOT '.product-overlay .add-to-cart'
    //
    // The product listing page (/products) shows "Add to cart" buttons
    // inside a CSS hover overlay (.product-overlay). That overlay is
    // display:none by default and only appears on :hover.
    //
    // Problems with hover overlays in Playwright:
    //   1. Playwright triggers hover via synthetic mouse events — but the
    //      site's heading element sits on top and intercepts the pointer.
    //   2. On mobile viewports (Pixel 5, iPhone 14) there is no hover state
    //      at all. Touch devices skip :hover entirely.
    //   3. Even on desktop, the overlay animation takes time. If Playwright
    //      clicks before the overlay finishes animating in, the element
    //      is technically "visible" but still intercepted.
    //
    // THE FIX: Navigate directly to /product_details/:id
    // That page has a permanently visible "Add to cart" button in the main
    // product info section. No hover, no overlay, works on every browser
    // and every device viewport.
    // ─────────────────────────────────────────────────────────────────────────

    this.addToCartButton = page.locator('button', { hasText: 'Add to cart' });
    // Matches the <button>Add to cart</button> on the product detail page.
    // hasText does a case-sensitive partial match.
    // This button is always visible — no hover state required.

    this.productName  = page.locator('.product-information h2');
    this.productPrice = page.locator('.product-information span span');

    this.cartModalMessage       = page.locator('#cartModal .modal-body p').first();
    this.continueShoppingButton = page.locator('button[data-dismiss="modal"]');
    this.viewCartButton         = page.locator('#cartModal a[href="/view_cart"]');
  }

  async goToProductDetail(productId: number = 1): Promise<void> {
    // Navigate directly to the product detail page for the given product ID.
    //
    // Product IDs 1 and 2 always exist on automationexercise.com:
    //   /product_details/1 → "Blue Top"
    //   /product_details/2 → "Men Tshirt"
    //
    // Using specific IDs (not .first() on a list) makes the test deterministic.
    // You always know exactly which product was added to the cart.
    await this.page.goto(`/product_details/${productId}`, {
      waitUntil: 'domcontentloaded',
      // domcontentloaded: don't wait for ads to load, just the product DOM
    });
  }

  async addToCart(): Promise<void> {
    // The "Add to cart" button on the detail page is always visible.
    // waitFor ensures it's in the DOM before we click.
    await this.addToCartButton.waitFor({ state: 'visible' });
    await this.addToCartButton.click();

    // Wait for the success modal to confirm the item was actually added.
    // Without this wait, the next step might run before the cart is updated.
    await this.cartModalMessage.waitFor({ state: 'visible' });
  }

  async continueShopping(): Promise<void> {
    // Closes the "Product Added" modal and stays on the current page.
    await this.continueShoppingButton.click();

    // Wait for modal to fully close before proceeding.
    // If we navigate away while the modal is mid-close, the DOM teardown
    // can cause "element detached" errors on the next page.
    await this.continueShoppingButton.waitFor({ state: 'hidden' });
  }

  async getProductName(): Promise<string> {
    return (await this.productName.textContent()) ?? '';
    // ?? '' is the nullish coalescing operator.
    // Returns '' if textContent() returns null — prevents type errors downstream.
  }
}
