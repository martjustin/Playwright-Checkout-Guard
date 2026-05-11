import { test, expect } from '../fixtures/test.fixtures';

test.describe('Product Search', () => {
  test('Search returns products matching the submitted keyword', async ({
    page,
  }) => {
    const searchTerm = 'Dress';

    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await page.locator('#search_product').fill(searchTerm);
    await page.locator('#submit_search').click();

    await expect(
      page.getByRole('heading', { name: /searched products/i })
    ).toBeVisible();

    const productNames = page.locator('.features_items .productinfo p');
    await expect(productNames.first()).toBeVisible();

    const names = await productNames.allTextContents();
    expect(
      names.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    ).toBe(true);
  });
});
