// tests/checkout.spec.ts
import { test, expect }        from '../fixtures/test.fixtures';
import type { Route }          from '@playwright/test';
import { generateCardDetails }  from '../utils/test-data';
import { ProductPage }          from '../pages/ProductPage';


test.describe('Checkout Flow — End to End', () => {

  test('@smoke Full checkout completes with order confirmation', async ({
    loggedInPage,
    cartPage,
    checkoutPage,
  }) => {
    const productPage = new ProductPage(loggedInPage);

    // ── Add product and navigate to cart via the modal ────────────────────────
    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.goToCart();
    // goToCart() clicks "View Cart" inside the success modal.
    // We arrive at /view_cart in the same session state where the add was confirmed.
    // The cart is guaranteed to have the item — no race with session cookies.

    // ── Verify item is in cart ────────────────────────────────────────────────
    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThan(0);
    // This was failing with Received: 0.
    // Now that we navigate via the modal instead of a separate page.goto(),
    // the session state is intact and the item is present.

    // ── Proceed through checkout ──────────────────────────────────────────────
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPageLoad();

    const deliveryAddress = await checkoutPage.getDeliveryAddressText();
    expect(deliveryAddress.trim().length).toBeGreaterThan(0);

    await checkoutPage.addOrderComment('Automated smoke test — safe to ignore');
    await checkoutPage.clickPlaceOrder();

    const cardDetails = generateCardDetails();
    await checkoutPage.fillPaymentDetails(cardDetails);
    await checkoutPage.confirmPayment();

    const isSuccessful = await checkoutPage.isOrderSuccessful();
    expect(isSuccessful).toBe(true);
  });


  test('Cart preserves items after browser refresh', async ({
    loggedInPage,
    cartPage,
  }) => {
    const productPage = new ProductPage(loggedInPage);

    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.goToCart();
    // ↑ Same fix — arrive at cart through the modal, not a separate navigate()

    const countBefore = await cartPage.getCartItemCount();
    expect(countBefore).toBeGreaterThan(0);

    await loggedInPage.reload({ waitUntil: 'domcontentloaded' });
    await cartPage.waitForPageLoad();

    const countAfter = await cartPage.getCartItemCount();
    expect(countAfter).toBe(countBefore);
  });


  test('Removing an item updates the cart count', async ({
    loggedInPage,
    cartPage,
  }) => {
    const productPage = new ProductPage(loggedInPage);

    // Add product 1 — stay on site to add a second
    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.continueShopping();
    // continueShopping() is correct here because we need to stay
    // on the page to add a second product. We use goToCart() only
    // after the LAST add-to-cart action.

    // Add product 2 — now go to cart via modal
    await productPage.goToProductDetail(2);
    await productPage.addToCart();
    await productPage.goToCart();
    // Navigate to cart via the modal after the final add.

    const countBefore = await cartPage.getCartItemCount();
    expect(countBefore).toBe(2);

    await cartPage.removeFirstItem();

    const countAfter = await cartPage.getCartItemCount();
    expect(countAfter).toBe(1);
  });


  test('@negative Checkout without login shows register prompt', async ({
    page,
    cartPage,
  }) => {
    // Uses bare `page` — anonymous session, not loggedInPage
    const productPage = new ProductPage(page);

    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.goToCart();
    // Same fix applies for anonymous users — go to cart via the modal link

    await cartPage.proceedToCheckout();

    const loginPrompt = page.locator('u', { hasText: 'Register / Login' });
    await expect(loginPrompt).toBeVisible({ timeout: 8_000 });
  });

});


test.describe('Checkout — Network Resilience', () => {

  test('Checkout page loads within acceptable time on throttled network', async ({
    loggedInPage,
    cartPage,
  }) => {
    const productPage = new ProductPage(loggedInPage);

    // ── Add item at full speed BEFORE enabling throttle ───────────────────────
    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.goToCart();
    // Full-speed add via modal. Throttle only applies to checkout navigation.

    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThan(0);
    // Confirm cart is populated before starting the performance measurement.

    // ── Enable throttle for checkout navigation only ──────────────────────────
    const throttleCheckout = async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    };

    await loggedInPage.route('**/checkout', throttleCheckout);

    const start = Date.now();
    await cartPage.proceedToCheckout();
    const elapsed = Date.now() - start;

    // ── Remove throttle before teardown runs ──────────────────────────────────
    await loggedInPage.unroute('**/checkout', throttleCheckout);

    expect(elapsed).toBeLessThan(15_000);
    console.log(`[PERF] Checkout on throttled network: ${elapsed}ms`);
  });

});
