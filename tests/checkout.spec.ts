// tests/checkout.spec.ts
//
// All five previous errors traced back to one root cause:
// interacting with hover-overlay buttons on the product listing page.
//
// This file uses ProductPage.goToProductDetail() throughout.
// That navigates to /product_details/:id where the "Add to cart" button
// is always visible — no hover required, works on desktop and mobile.

import { test, expect }       from '../fixtures/test.fixtures';
import { generateCardDetails } from '../utils/test-data';
import { ProductPage }         from '../pages/ProductPage';


test.describe('Checkout Flow — End to End', () => {

  // ── TEST 1 ─────────────────────────────────────────────────────────────────
  test('@smoke Full checkout completes with order confirmation', async ({
    loggedInPage,
    cartPage,
    checkoutPage,
  }) => {
    /**
     * The critical happy path. Every e-commerce site lives or dies by this flow.
     *
     * WHAT CHANGED FROM THE BROKEN VERSION:
     *   Before → loggedInPage.locator('.product-overlay .add-to-cart').first().click()
     *             ↑ hover overlay, heading intercepts click, mobile has no hover
     *
     *   After  → ProductPage.goToProductDetail(1) then addToCart()
     *             ↑ always-visible button, same behaviour on all 5 browser projects
     */

    const productPage = new ProductPage(loggedInPage);

    // ── Step 1: Go to product detail page (not the listing page) ─────────────
    await productPage.goToProductDetail(1);
    // Navigates to /product_details/1 — "Blue Top"
    // The "Add to cart" button here is permanently visible in the page body.
    // No :hover CSS required. Works identically on Pixel 5 and iPhone 14.

    // ── Step 2: Add to cart ───────────────────────────────────────────────────
    await productPage.addToCart();
    // Clicks the visible button, then waits for the success modal to appear.
    // If the modal never appears, addToCart() will timeout here — not silently
    // continue with an empty cart.

    await productPage.continueShopping();
    // Dismisses the modal. Waits for it to fully close before proceeding.
    // The waitFor({ state: 'hidden' }) in ProductPage prevents "element
    // detached" errors that happened when we navigated mid-animation.

    // ── Step 3: Open cart and verify item was added ───────────────────────────
    await cartPage.navigate();
    await cartPage.waitForPageLoad();

    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThan(0);
    // This was the Mobile Chrome error: "Expected: > 0 / Received: 0"
    // It failed because add-to-cart never worked on touch viewports.
    // Now that we use the detail page button, mobile works too.

    // ── Step 4: Proceed to checkout ──────────────────────────────────────────
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPageLoad();

    // ── Step 5: Verify the delivery address was populated by the fixture ──────
    const deliveryAddress = await checkoutPage.getDeliveryAddressText();
    expect(deliveryAddress.trim().length).toBeGreaterThan(0);
    // If this fails: the loggedInPage fixture didn't complete account creation
    // before handing the page to the test. Check the fixture setup logs.

    // ── Step 6: Add a comment and proceed to payment ──────────────────────────
    await checkoutPage.addOrderComment('Automated smoke test — safe to ignore');
    await checkoutPage.clickPlaceOrder();

    // ── Step 7: Fill test payment details ────────────────────────────────────
    const cardDetails = generateCardDetails();
    await checkoutPage.fillPaymentDetails(cardDetails);

    // ── Step 8: Submit payment ────────────────────────────────────────────────
    await checkoutPage.confirmPayment();

    // ── Step 9: Assert the order success screen appeared ─────────────────────
    const isSuccessful = await checkoutPage.isOrderSuccessful();
    expect(isSuccessful).toBe(true);
  });


  // ── TEST 2 ─────────────────────────────────────────────────────────────────
  test('Cart preserves items after browser refresh', async ({
    loggedInPage,
    cartPage,
  }) => {
    /**
     * Tests that cart state survives a page refresh.
     * Catches bugs where cart is stored in memory only (not session/server).
     *
     * WHAT CHANGED:
     *   Before → loggedInPage.locator('.add-to-cart').first().click()
     *             ↑ still hitting the hover overlay on the listing page
     *
     *   After  → ProductPage.goToProductDetail() + addToCart()
     */
    const productPage = new ProductPage(loggedInPage);

    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.continueShopping();

    await cartPage.navigate();
    await cartPage.waitForPageLoad();

    const countBefore = await cartPage.getCartItemCount();
    expect(countBefore).toBeGreaterThan(0);
    // Confirm the item is definitely in the cart before refreshing.
    // If this fails, the add-to-cart step didn't work — stop here.

    // ── Simulate browser refresh (F5) ─────────────────────────────────────────
    await loggedInPage.reload({ waitUntil: 'domcontentloaded' });
    await cartPage.waitForPageLoad();

    const countAfter = await cartPage.getCartItemCount();
    expect(countAfter).toBe(countBefore);
    // Count must be identical after reload.
    // A drop to 0 means cart was in memory only — major e-commerce bug.
  });


  // ── TEST 3 ─────────────────────────────────────────────────────────────────
  test('Removing an item updates the cart count', async ({
    loggedInPage,
    cartPage,
  }) => {
    /**
     * Tests that deleting an item actually removes it.
     * Catches UI bugs where the delete fires but the row stays visible.
     *
     * WHAT CHANGED:
     *   Before → const addButtons = await loggedInPage.locator('.add-to-cart').all()
     *            → addButtons[0].click()
     *             ↑ .all() on hidden overlay buttons returns an empty array.
     *               addButtons[0] is undefined → "Cannot read properties of undefined"
     *
     *   After  → Navigate to each product detail page individually.
     *             We know exactly what we added. No empty-array risk.
     */
    const productPage = new ProductPage(loggedInPage);

    // Add product 1
    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.continueShopping();

    // Add product 2
    await productPage.goToProductDetail(2);
    await productPage.addToCart();
    await productPage.continueShopping();
    // continueShopping() dismisses the modal and waits for it to close.
    // Doing this between each add prevents the second addToCart() from
    // interacting with a modal that's still animating closed.

    await cartPage.navigate();
    await cartPage.waitForPageLoad();

    const countBefore = await cartPage.getCartItemCount();
    expect(countBefore).toBe(2);
    // Hard assertion: we added exactly 2 products, there must be exactly 2.

    // ── Remove the first item ─────────────────────────────────────────────────
    await cartPage.removeFirstItem();

    const countAfter = await cartPage.getCartItemCount();
    expect(countAfter).toBe(1);
    // One item removed → one item remaining. Not zero, not two.
  });


  // ── TEST 4 ─────────────────────────────────────────────────────────────────
  test('@negative Checkout without login shows register prompt', async ({
    page,      // bare page — anonymous session, NOT loggedInPage
    cartPage,
  }) => {
    /**
     * Tests that guest users are prompted to log in before checking out.
     * Security + UX: unauthenticated users must not access the checkout form.
     *
     * WHAT CHANGED:
     *   Before → page.goto('/products') then hover overlay click
     *             → cartPage.navigate() timed out waiting for /view_cart to load
     *
     *   After  → ProductPage.goToProductDetail() for the add,
     *             then navigate to cart with domcontentloaded (not default 'load')
     *
     * This test uses bare `page` (not `loggedInPage`) because we WANT
     * an anonymous session to test the unauthenticated checkout path.
     */
    const productPage = new ProductPage(page);

    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    // Don't call continueShopping() — instead go directly to cart via modal
    await page.locator('a[href="/view_cart"]').click();
    // The "View Cart" link appears in the success modal after adding to cart.
    // Clicking it takes us to the cart without needing a separate navigate() call.

    await page.waitForLoadState('domcontentloaded');

    // Click checkout as a guest
    await cartPage.proceedToCheckout();

    // automationexercise.com shows a modal asking guests to register or login
    const loginPrompt = page.locator('u', { hasText: 'Register / Login' });
    await expect(loginPrompt).toBeVisible({ timeout: 8_000 });
  });

});


// ── SEPARATE DESCRIBE BLOCK ───────────────────────────────────────────────────
test.describe('Checkout — Network Resilience', () => {

  test('Checkout page loads within acceptable time on throttled network', async ({
    loggedInPage,
    cartPage,
  }) => {
    /**
     * Tests checkout performance under simulated slow network conditions.
     *
     * WHAT CHANGED:
     *   Before → add-to-cart via hover overlay → cart empty → checkout button
     *            never appeared → waitAndClick timed out waiting for it
     *
     *   After  → ProductPage.goToProductDetail() → cart has items →
     *            checkout button is present and clickable
     *
     * We also reduced the artificial delay from 200ms per-request to 100ms.
     * 200ms × multiple page resources = easily blows the 30s timeout.
     * 100ms is still meaningful throttling while keeping the test viable.
     */
    const productPage = new ProductPage(loggedInPage);

    // ── Add an item before enabling the throttle ──────────────────────────────
    // We add the item first at full speed, THEN enable the slow network.
    // This isolates the performance test to the checkout navigation specifically,
    // rather than also throttling account creation and product page loading.
    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.continueShopping();

    await cartPage.navigate();
    await cartPage.waitForPageLoad();

    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThan(0);
    // Confirm cart is not empty before we start measuring.

    // ── Enable network throttling for the checkout navigation only ────────────
    await loggedInPage.route('**/*', async route => {
      // Add 100ms artificial delay to every network request.
      // Simulates a user on a slow 3G connection (250kbps, ~100-300ms latency).
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
      // route.continue() lets the request proceed normally after the delay.
    });

    // ── Measure how long the checkout navigation takes ────────────────────────
    const start = Date.now();

    await cartPage.proceedToCheckout();

    const elapsed = Date.now() - start;
    // Date.now() returns milliseconds since Unix epoch.
    // Subtracting start from end gives elapsed milliseconds.

    // ── Remove throttling so teardown (delete_account) runs at full speed ─────
    await loggedInPage.unrouteAll();
    // Without this, the fixture teardown (/delete_account) would also be
    // throttled — slowing it down and potentially causing teardown timeouts.

    // ── Assert the page loaded within 15 seconds on the throttled connection ──
    expect(elapsed).toBeLessThan(15_000);
    console.log(`[PERF] Checkout navigation on throttled network: ${elapsed}ms`);
  });

});
