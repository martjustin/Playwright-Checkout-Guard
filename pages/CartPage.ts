// pages/CartPage.ts
// Represents the Shopping Cart page (/view_cart)
// All interactions with the cart are defined here — adding, removing, quantities

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  
  // Locators — defined as class properties so they're reusable
  // These are the "addresses" Playwright uses to find elements on the page
  
  readonly cartItems: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly productQuantities: Locator;
  readonly deleteButtons: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly emptyCartMessage: Locator;
  readonly totalPriceCell: Locator;

  constructor(page: Page) {
    super(page, '/view_cart');
    // super() calls BasePage's constructor with the cart page path
    
    // Define all locators in the constructor
    // This is the key POM principle: locators live in the page class, NOT in tests
    // If the HTML changes, you update ONE file, not 20 test files
    
    this.cartItems = page.locator('tr.cart_item');
    // Selects ALL rows in the cart table — each row is one product
    
    this.productNames = page.locator('td.cart_description h4 a');
    // The product name link inside each cart row
    
    this.productPrices = page.locator('td.cart_price p');
    // Price column in each cart row
    
    this.productQuantities = page.locator('td.cart_quantity button');
    // Quantity shown for each item
    
    this.deleteButtons = page.locator('td.cart_delete a');
    // The "×" delete button on each cart row
    
    this.proceedToCheckoutButton = page.locator('a[class*="check_out"]');
    
    this.emptyCartMessage = page.locator('#empty_cart');
    // The message shown when cart is empty
    
    this.totalPriceCell = page.locator('td.cart_total_price');
  }

  async getCartItemCount(): Promise<number> {
    // Returns how many distinct products are in the cart
    // count() returns 0 if no elements found — no throw
    return await this.cartItems.count();
  }

  async getProductNames(): Promise<string[]> {
    // Returns an array of all product name strings in the cart
    // allTextContents() extracts text from ALL matching elements at once
    return await this.productNames.allTextContents();
  }

  async removeFirstItem(): Promise<void> {
    // Remove the first product from the cart
    // .first() selects the first matching element
    await this.deleteButtons.first().click();
    
    // After clicking delete, wait for the page to update
    // The cart table re-renders — we wait for it to stabilise
    await this.page.waitForLoadState('networkidle');
  }

  async isCartEmpty(): Promise<boolean> {
    // Check if the empty cart message is visible
    // isVisible() returns false (no throw) if element doesn't exist
    return await this.emptyCartMessage.isVisible();
  }

  async getTotalPrice(): Promise<number> {
    // Extract the total price as a number for comparison
    const priceText = await this.totalPriceCell.first().textContent() || '0';
    
    // priceText might be "Rs. 1,234" — we strip everything except digits and dots
    const numericString = priceText.replace(/[^0-9.]/g, '');
    // [^0-9.] means "any character that is NOT a digit or dot"
    // replace removes all those characters
    
    return parseFloat(numericString);
    // parseFloat converts "1234" string to 1234 number
  }

  async proceedToCheckout(): Promise<void> {
    await this.waitAndClick(this.proceedToCheckoutButton);
    // waitAndClick is inherited from BasePage — waits for visible + enabled
  }

  async verifyProductInCart(productName: string): Promise<void> {
    // Assert that a specific product is present in the cart
    // Using expect() with a Locator — Playwright auto-retries for up to 5 seconds
    // If the element appears within 5s, test passes. Otherwise fails with timeout.
    await expect(
      this.page.locator('td.cart_description h4 a', { hasText: productName })
    ).toBeVisible();
    // hasText is a filter: find the element that contains this specific text
  }
}
