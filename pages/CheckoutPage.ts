// pages/CheckoutPage.ts
// The checkout flow — address confirmation, order review, payment details
// This is the most critical page: bugs here mean lost revenue
// Double Check this page's code before commit

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  
  // Checkout address section
  readonly deliveryAddress: Locator;
  readonly billingAddress: Locator;
  
  // Order summary
  readonly orderItems: Locator;
  readonly orderTotal: Locator;
  
  // Comment and payment section
  readonly orderCommentBox: Locator;
  readonly placeOrderButton: Locator;
  
  // Payment details form
  readonly nameOnCardInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cvvInput: Locator;
  readonly expiryMonthInput: Locator;
  readonly expiryYearInput: Locator;
  readonly confirmOrderButton: Locator;
  
  // Order success confirmation
  readonly orderSuccessMessage: Locator;
  readonly orderSuccessHeader: Locator;

  constructor(page: Page) {
    super(page, '/checkout');
    
    this.deliveryAddress = page.locator('#address_delivery');
    this.billingAddress = page.locator('#address_invoice');
    
    this.orderItems = page.locator('#cart_info tbody tr');
    
    this.orderCommentBox = page.locator('textarea[name="message"]');
    this.placeOrderButton = page.locator('a[href="/payment"]');
    
    // Payment form — on the /payment page
    this.nameOnCardInput = page.locator('[data-qa="name-on-card"]');
    this.cardNumberInput = page.locator('[data-qa="card-number"]');
    this.cvvInput = page.locator('[data-qa="cvc"]');
    this.expiryMonthInput = page.locator('[data-qa="expiry-month"]');
    this.expiryYearInput = page.locator('[data-qa="expiry-year"]');
    this.confirmOrderButton = page.locator('[data-qa="pay-button"]');
    
    this.orderSuccessMessage = page.locator('[data-qa="order-placed"]');
    this.orderSuccessHeader = page.locator('h2[data-qa="order-placed"]');
  }

  async getDeliveryAddressText(): Promise<string> {
    return await this.deliveryAddress.textContent() || '';
  }

  async addOrderComment(comment: string): Promise<void> {
    await this.orderCommentBox.fill(comment);
    // fill() clears existing content then types the new value
    // Safer than type() which appends to existing content
  }

  async clickPlaceOrder(): Promise<void> {
    await this.waitAndClick(this.placeOrderButton);
    await this.waitForPageLoad();
  }

  async fillPaymentDetails(cardDetails: {
    nameOnCard: string;
    cardNumber: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
  }): Promise<void> {
    // Fill all payment fields in sequence
    // Using destructuring to unpack the cardDetails object
    const { nameOnCard, cardNumber, cvv, expiryMonth, expiryYear } = cardDetails;
    
    await this.nameOnCardInput.fill(nameOnCard);
    await this.cardNumberInput.fill(cardNumber);
    await this.cvvInput.fill(cvv);
    await this.expiryMonthInput.fill(expiryMonth);
    await this.expiryYearInput.fill(expiryYear);
  }

  async confirmPayment(): Promise<void> {
    await this.waitAndClick(this.confirmOrderButton);
    await this.waitForPageLoad();
  }

  async isOrderSuccessful(): Promise<boolean> {
    return await this.orderSuccessMessage.isVisible();
  }

  async getOrderCount(): Promise<number> {
    return await this.orderItems.count();
  }
}
