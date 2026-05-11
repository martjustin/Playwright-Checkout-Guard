import { test, expect } from '../fixtures/test.fixtures';
import { ProductPage } from '../pages/ProductPage';

test.describe('Cart Sanity', () => {
  test('Added product appears in the cart with a total price', async ({
    page,
    cartPage,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.goToProductDetail(1);
    const productName = await productPage.getProductName();

    await productPage.addToCart();
    await productPage.goToCart();

    await cartPage.verifyProductInCart(productName);
    await expect(cartPage.cartItems).toHaveCount(1);
    expect(await cartPage.getTotalPrice()).toBeGreaterThan(0);
  });
});
