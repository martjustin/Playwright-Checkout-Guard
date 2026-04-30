// tests/checkout.spec.ts
import { test, expect } from '../fixtures/test.fixtures';
import { generateCardDetails }  from '../utils/test-data';
import { ProductPage } from '../pages/ProductPage';

test.describe('Checkout Flow — End to End', () => {

  test('@smoke Full checkout completes with order confirmation', async ({
    loggedInPage,
    cartPage,
    checkoutPage,
  }) => {
    /**
     * WHAT CHANGED AND WHY:
     *
     * Before: clicked '.product-overlay .add-to-cart'
     * → Required CSS hover state to make button visible
     * → Heading intercepted pointer events before hover fired
     * → Touch devices (Mobile Chrome/Safari) have no hover → silently failed
     *
     * After: navigate to /product_details/1, click the always-visible button
     * → No hover needed
     * → Button is in the DOM and visible on every browser and device
     * → One locator that works across all 5 test projects
     */

    // ── Step 1: Navigate to a product detail page ───────────────────────────
    const productPage = new ProductPage(loggedInPage);
    await productPage.goToProductDetail(1);
    // Goes to: https://www.automationexercise.com/product_details/1
    // Product ID 1 is "Blue Top" — always present on this site

    // ── Step 2: Add it to cart using the always-visible button ───────────────
    await productPage.addToCart();
    // Clicks the "Add to cart" button on the detail page (no hover required)
    // Waits for the confirmation modal to appear

    await productPage.continueShopping();
    // Dismisses the "Added successfully" modal

    // ── Step 3: Navigate to cart and verify item is there ────────────────────
    await cartPage.navigate();
    await cartPage.waitForPageLoad();

    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThan(0);
    // If this still fails after the fix, the add-to-cart step didn't work.
    // Run with --headed to watch it happen: npx playwright test --headed

    // ── Step 4: Proceed to checkout ─────────────────────────────────────────
    await cartPage.proceedToCheckout();
    await checkoutPage.waitForPageLoad();

    // ── Step 5: Verify delivery address was populated ────────────────────────
    const deliveryAddress = await checkoutPage.getDeliveryAddressText();
    expect(deliveryAddress.trim().length).toBeGreaterThan(0);
    // .trim() removes whitespace before checking length
    // An empty address means the loggedIn fixture didn't fill the address fields

    // ── Step 6: Add a comment and place the order ────────────────────────────
    await checkoutPage.addOrderComment('QA smoke test order — safe to ignore');
    await checkoutPage.clickPlaceOrder();

    // ── Step 7: Fill payment details ─────────────────────────────────────────
    const cardDetails = generateCardDetails();
    await checkoutPage.fillPaymentDetails(cardDetails);

    // ── Step 8: Confirm payment ───────────────────────────────────────────────
    await checkoutPage.confirmPayment();

    // ── Step 9: Assert order success ─────────────────────────────────────────
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
    await productPage.continueShopping();

    await cartPage.navigate();
    const countBefore = await cartPage.getCartItemCount();
    expect(countBefore).toBeGreaterThan(0);

    // Simulate F5 / browser refresh
    await loggedInPage.reload();
    await cartPage.waitForPageLoad();

    const countAfter = await cartPage.getCartItemCount();

    expect(countAfter).toBe(countBefore);
    // Cart must survive a refresh — items stored in session, not just memory
  });


  test('Removing an item updates the cart count', async ({
    loggedInPage,
    cartPage,
  }) => {
    const productPage = new ProductPage(loggedInPage);

    // Add two different products
    await productPage.goToProductDetail(1);
    await productPage.addToCart();
    await productPage.continueShopping();

    await productPage.goToProductDetail(2);
    await productPage.addToCart();
    await productPage.continueShopping();

    await cartPage.navigate();

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
    // Uses bare `page` (anonymous session) — NOT loggedInPage

    const productPage = new ProductPage(page);
    await productPage.goToProductDetail(1);

    // Add to cart as anonymous user
    await productPage.addToCart();
    await page.locator('[data-dismiss="modal"]').click();

    await cartPage.navigate();
    await cartPage.proceedToCheckout();

    // AutomationExercise shows a modal prompting login/register for guests
    const prompt = page.locator('u', { hasText: 'Register / Login' });
    await expect(prompt).toBeVisible({ timeout: 8_000 });
  });

});
