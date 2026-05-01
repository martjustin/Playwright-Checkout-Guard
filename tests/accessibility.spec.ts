// tests/accessibility.spec.ts
// Accessibility testing using axe-core via @axe-core/playwright
//
// Why accessibility testing in a portfolio?
// 1. It's legally required in EU (EN 301 549), UK (PSBAR), and US (ADA/Section 508)
// 2. Companies like Booking.com, Zalando, and Personio have dedicated a11y QA roles
//
// axe-core is used by Microsoft, Google, and thousands of enterprise teams.

import { test, expect } from '../fixtures/test.fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {

  test('Homepage has no critical accessibility violations', async ({ page }) => {
    /**
     * Axe scans the DOM for WCAG (Web Content Accessibility Guidelines) violations.
     * These include: missing alt text, insufficient color contrast, missing form labels,
     * keyboard navigation issues, and more.
     *
     * WCAG 2.1 AA is the standard required by most companies and legally mandated
     * in the EU and UK.
     */
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run axe analysis on the entire page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // withTags filters to ONLY check WCAG 2.0 A and AA rules
      // Without this, axe also runs 'best-practice' rules which are stricter
      // and may flag issues that aren't actual compliance violations
      .analyze();
    
    // violations is an array of found issues
    // Each violation has: id, impact, description, nodes (where it was found)
    expect(accessibilityScanResults.violations).toEqual([]);
    // Asserts: the array of violations is empty (no violations found)
    
    // If this fails, you see something like:
    // Expected [] to equal [{ id: 'color-contrast', impact: 'serious', ... }]
    // — which tells you exactly what WCAG rule was violated
  });

  test('Product page images have alt text', async ({ page }) => {
    /**
     * TARGETED ACCESSIBILITY TEST: Image alt text specifically.
     *
     * Images without alt text are inaccessible to screen readers (used by ~7M people
     * in Nigeria alone, many using TalkBack on Android).
     * An e-commerce site without alt text on product images loses those users.
     *
     * We test this specifically because:
     * 1. Product images are dynamically loaded — the general axe scan might miss them
     * 2. Missing alt text is one of the top 5 most common WCAG failures globally
     */
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Find all product images
    const productImages = page.locator('.product-image-wrapper img');
    const imageCount = await productImages.count();
    
    expect(imageCount).toBeGreaterThan(0);
    // Sanity check: we must have found SOME images
    
    // Check EACH image has an alt attribute
    for (let i = 0; i < imageCount; i++) {
      const img = productImages.nth(i);
      // .nth(i) selects the i-th element (0-indexed)
      
      const altText = await img.getAttribute('alt');
      // getAttribute('alt') gets the value of the alt HTML attribute
      // Returns null if the attribute doesn't exist
      
      expect(altText).toBeTruthy();
      // Fails if alt is null (missing), undefined, or empty string ""
      // An empty alt is as bad as no alt for screen readers
    }
  });

  test('Checkout form fields have associated labels', async ({
    loggedInPage,
    cartPage,
  }) => {
    /**
     * FORM ACCESSIBILITY TEST: Every input must have a label.
     *
     * When inputs don't have labels, screen reader users hear "edit text, blank"
     * instead of "Card Number, edit text". In a payment form, this is catastrophic —
     * blind users can't safely fill in their card details.
     *
     * N26 and Revolut both had accessibility audits that flagged unlabelled
     * form fields in their payment flows. This test would have caught those.
     */
    
    // Set up cart and proceed to checkout
    await loggedInPage.goto('/products');
    await loggedInPage.locator('.add-to-cart').first().click();
    await loggedInPage.locator('[data-dismiss="modal"]').click();
    await cartPage.navigate();
    await cartPage.proceedToCheckout();
    
    // Run targeted axe scan on ONLY the checkout form
    // Scoping reduces noise from other page elements
    const results = await new AxeBuilder({ page: loggedInPage })
      .include('#checkout_form_group')
      // .include() scopes the scan to a specific CSS selector
      // We only check the checkout form, not the entire page
      .withTags(['wcag2a'])
      .analyze();
    
    const formLabelViolations = results.violations.filter(
      v => v.id === 'label'
      // Filter to only the 'label' rule violations
      // The 'label' rule checks that inputs have associated <label> elements
    );
    
    expect(formLabelViolations).toHaveLength(0);
  });
});
