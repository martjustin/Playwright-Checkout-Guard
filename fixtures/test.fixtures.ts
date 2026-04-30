// fixtures/test.fixtures.ts  — loggedInPage fixture teardown section only
// (keep everything else the same, only change the teardown block)

  loggedInPage: async ({ page }, use) => {

    // ── SETUP: create and log in a fresh user ───────────────────────────────
    const testUser = generateUser();

    await page.goto('/login');
    await page.locator('[data-qa="signup-name"]').fill(testUser.name);
    await page.locator('[data-qa="signup-email"]').fill(testUser.email);
    await page.locator('[data-qa="signup-button"]').click();

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

    await page.waitForSelector('[data-qa="account-created"]');
    await page.locator('[data-qa="continue-button"]').click();

    // ── HAND OFF to the test ─────────────────────────────────────────────────
    await use(page);

    // ── TEARDOWN: delete the account after the test finishes ─────────────────
    // ✅ FIX: Wrap teardown in try/catch.
    // If the test timed out, the page may already be in a broken or closed state.
    // Without try/catch, a teardown failure would mask the REAL test failure
    // and make the error log confusing.
    try {
      await page.goto('/delete_account', { timeout: 15_000 });
      // Give the delete navigation its own timeout so a slow response
      // doesn't block the next test from starting
    } catch (error) {
      console.warn(
        `[FIXTURE] Could not delete test account for ${testUser.email}. ` +
        `Page may have been closed by a test timeout. ` +
        `Manual cleanup may be needed in the AutomationExercise dashboard.`
      );
      // Log the warning but don't rethrow — we don't want a cleanup
      // failure to mark a passed test as failed
    }
  },
