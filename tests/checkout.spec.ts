// tests/checkout.spec.ts
// The main checkout flow tests.
// These cover the most business-critical user journey:
// Browse → Add to Cart → Checkout → Pay → Order Confirmed

// Import our CUSTOM test (with fixtures), not the base @playwright/test
import { test, expect } from '../fixtures/test.fixtures';
import { generateCardDetails } from '../utils/test-data';

// Group related tests into describe blocks for organisation
// In the HTML report, these appear as collapsible sections
test.describe('Checkout Flow — End to End', () => {

  test('@smoke Full checkout completes with order confirmation', async ({
    page,
    loggedInPage,  // Playwright injects this fixture — user is logged in
    cartPage,
    checkoutPage,
  }) => {
    /**
     * TEST STRATEGY: This is the critical happy-path test.
     * If THIS test fails, the entire revenue flow is broken.
     * @smoke tag means it runs in smoke suite on every deployment.
     *
     * FLOW:
     * 1. Add a product to cart
     * 2. View cart
     * 3. Proceed to checkout
     * 4. Verify delivery address
     * 5. Place order
     * 6. Fill payment details
     * 7. Confirm order
     * 8. Verify success message
     */
    
    // Step 1: Add a product to cart from the products page
    await loggedInPage.goto('/products');
    // We use loggedInPage (not page) because this test needs a logged-in session
    
    // Add the first product
    await loggedInPage.locator('.product-overlay .add-to-cart').first().click();
    
    // Handle the "Added to cart" modal that pops up
    await loggedInPage.locator('[data-dismiss="modal"]').click();
    // data-dismiss="modal" is Bootstrap's close button pattern
    
    // Step 2: Navigate to cart
    await cartPage.navigate();
    
    // Step 3: Verify product is in cart
    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThan(0);  // At least one item
    
    // Step 4: Proceed to checkout
    await cartPage.proceedToCheckout();
    
    // Step 5: Verify checkout page loaded and has address
    const deliveryAddress = await checkoutPage.getDeliveryAddressText();
    expect(deliveryAddress).toBeTruthy();
    // toBeTruthy() checks it's not null, undefined, or empty string
    
    // Step 6: Add an order comment
    await checkoutPage.addOrderComment('Please gift wrap with shiny wrapper — no dull colors!');
    
    // Step 7: Click "Place Order" to proceed to payment
    await checkoutPage.clickPlaceOrder();
    
    // Step 8: Fill payment details
    const cardDetails = generateCardDetails();
    await checkoutPage.fillPaymentDetails(cardDetails);
    
    // Step 9: Confirm payment
    await checkoutPage.confirmPayment();
    
    // Step 10: Verify order success
    const isSuccessful = await checkoutPage.isOrderSuccessful();
    expect(isSuccessful).toBe(true);
  });

  
  test('Cart preserves quantity after browser refresh', async ({
    loggedInPage,
    cartPage,
  }) => {
    /**
     * PERSISTENCE TEST: Items in cart must survive a page refresh.
     *
     * Real bug this catches: If cart state is only stored in memory
     * (not in localStorage or server session), refreshing the page clears the cart.
     * This is a Zalando/Amazon-level bug — users lose their cart and never return.
     * 
     **/
    
    // Add product to cart
    await loggedInPage.goto('/products');
    await loggedInPage.locator('.add-to-cart').first().click();
    await loggedInPage.locator('[data-dismiss="modal"]').click();
    
    await cartPage.navigate();
    const initialCount = await cartPage.getCartItemCount();
    
    // Simulate browser refresh
    await loggedInPage.reload();
    // reload() is Playwright's way to simulate F5 / Ctrl+R
    
    await cartPage.waitForPageLoad();
    
    const countAfterRefresh = await cartPage.getCartItemCount();
    
    expect(countAfterRefresh).toBe(initialCount);
    // Cart count must be identical before and after refresh
  });

  
  test('Removing item from cart updates total', async ({
    loggedInPage,
    cartPage,
  }) => {
    /**
     * CALCULATION TEST: Cart total must update when items are removed.
     *
     * This sounds obvious but it's caught real bugs — where the UI shows
     * an updated item count but the TOTAL PRICE doesn't recalculate.
     * A user removes a ₦5,000 item but still gets charged ₦5,000 extra.
     * This is exactly the kind of bug Wolt found in their wallet+promo scenario.
     */
    
    // Add two products
    await loggedInPage.goto('/products');
    const addButtons = await loggedInPage.locator('.add-to-cart').all();
    // .all() returns an array of all matching Locators
    
    // Add first product
    await addButtons[0].click();
    await loggedInPage.locator('[data-dismiss="modal"]').click();
    
    // Add second product
    await addButtons[1].click();
    await loggedInPage.locator('[data-dismiss="modal"]').click();
    
    await cartPage.navigate();
    
    const initialItemCount = await cartPage.getCartItemCount();
    const initialTotal = await cartPage.getTotalPrice();
    
    // Remove one item
    await cartPage.removeFirstItem();
    
    const newItemCount = await cartPage.getCartItemCount();
    const newTotal = await cartPage.getTotalPrice();
    
    // Item count decreased by 1
    expect(newItemCount).toBe(initialItemCount - 1);
    
    // Total price decreased (can't assert exact amount without knowing price,
    // but it MUST be less than before)
    expect(newTotal).toBeLessThan(initialTotal);
  });

  
  test('@negative Checkout without login redirects to login page', async ({
    page,    // Note: NOT loggedInPage — this test intentionally uses anonymous session
    cartPage,
  }) => {
    /**
     * NEGATIVE / AUTH TEST: Unauthenticated users attempting checkout
     * must be redirected to login — not shown a broken checkout page.
     *
     * This is both a UX test AND a security test.
     * UX: Users shouldn't see a broken/empty checkout form.
     * Security: Order data (addresses, payment intents) should require auth.
     */
    
    // Add a product as anonymous user
    await page.goto('/products');
    await page.locator('.add-to-cart').first().click();
    await page.locator('[data-dismiss="modal"]').click();
    
    // Navigate to cart
    await cartPage.navigate();
    
    // Click checkout without being logged in
    await cartPage.proceedToCheckout();
    
    // Expect: modal or redirect asking to login/register
    // AutomationExercise shows a modal with "Register / Login" option
    const loginPrompt = page.locator('u', { hasText: 'Register / Login' });
    await expect(loginPrompt).toBeVisible({ timeout: 5000 });
  });
});


test.describe('Checkout — Network Resilience', () => {
  
  test('Checkout page gracefully handles slow network', async ({
    page,
    loggedInPage,
    cartPage,
  }) => {
    /**
     * PERFORMANCE + RESILIENCE TEST: Checkout must remain usable on slow connections.
     *
     * Using Playwright's built-in network simulation — no Charles Proxy needed.
     * We simulate a "Fast 3G" connection and verify checkout still completes.
     *
     * A well-built checkout degrades gracefully and shows loading states.
     **/
    
    // Simulate Fast 3G network conditions
    await page.route('**/*', async (route) => {
      // Add 200ms delay to every network request
      await new Promise(resolve => setTimeout(resolve, 200));
      // This simulates network latency without blocking the test completely
      await route.continue();
      // route.continue() lets the request go through normally after the delay
    });
    
    // Add product
    await loggedInPage.goto('/products');
    await loggedInPage.locator('.add-to-cart').first().click();
    await loggedInPage.locator('[data-dismiss="modal"]').click();
    
    await cartPage.navigate();
    
    // Measure time from checkout start to page loaded
    const startTime = Date.now();
    await cartPage.proceedToCheckout();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Even on slow network, the page must load within 10 seconds
    // (industry standard for acceptable degraded-mode performance)
    expect(loadTime).toBeLessThan(10_000);
    
    console.log(`Checkout load time on throttled network: ${loadTime}ms`);
    // This logs to the test report — useful for tracking performance trends
  });
});
