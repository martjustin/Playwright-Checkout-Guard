// utils/test-data.ts
// Test data generators using @faker-js/faker
// Same concept as the Python factories.py — unique data per test run

import { faker } from '@faker-js/faker';

export interface TestUser {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phone: string;
}

export interface CardDetails {
  nameOnCard: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
}

export function generateUser(): TestUser {
  // Generate a realistic test user
  // faker.seed() is NOT called here — we want truly random data every run
  // This prevents stale-state bugs where a test always uses the same user
  
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    
    // Unique email is CRITICAL — duplicate emails cause registration failures
    email: faker.internet.email({ firstName, lastName }),
    // Generates: "John.Smith_4829@example.com" — unique per call
    
    password: `Test${faker.string.alphanumeric(8)}!`,
    // Always meets typical requirements: uppercase, lowercase, digits, special char
    
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipcode: faker.location.zipCode('#####'),  // 5-digit US format
    phone: faker.string.numeric(10),   // 10-digit format
  };
}

export function generateCardDetails(): CardDetails {
  // These are Stripe test card numbers that many practice sites accept
  // NOT real cards — they're the industry standard for test environments
  const testCards = [
    '4111111111111111',   // Visa test card
    '5500005555555559',   // Mastercard test card
    '4000000000000002',   // Visa decline test (for negative tests)
  ];
  
  return {
    nameOnCard: faker.person.fullName(),
    cardNumber: testCards[0]!,  // Use the Visa success card by default
    cvv: faker.string.numeric(3),        // 3-digit CVV
    expiryMonth: faker.date.future().toLocaleString('en', { month: '2-digit' }),
    expiryYear: String(new Date().getFullYear() + 2),  // 2 years from now
  };
}
