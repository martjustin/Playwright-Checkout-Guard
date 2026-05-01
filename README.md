# Playwright Checkout Guard

A production-style Playwright + TypeScript test automation project for validating critical e-commerce checkout flows on [automationexercise.com](https://www.automationexercise.com).

## Why this repository exists

Checkout is the highest-risk area in e-commerce. This suite focuses on preventing regressions that directly impact conversion:
- add-to-cart reliability
- cart persistence
- checkout completion
- payment submission
- accessibility checks on key flows

## Tech stack

- **Playwright Test** (cross-browser E2E)
- **TypeScript** (strict typing)
- **Page Object Model (POM)**
- **axe-core + Playwright** (accessibility audits)
- **faker** (realistic, unique test data)

## Project structure

- `pages/` → Page Object Model classes (`BasePage`, `ProductPage`, `CartPage`, `CheckoutPage`, `HomePage`)
- `fixtures/` → custom Playwright fixtures including authenticated `loggedInPage`
- `tests/` → end-to-end and accessibility specs
- `utils/` → test data generation and helper utilities
- `playwright.config.ts` → browser matrix, retries, timeouts, reporters

## Prerequisites

- Node.js 20+
- npm 10+

## Installation

```bash
npm install
npx playwright install
```

## Run the suite

```bash
npm test
```

## Helpful scripts

```bash
npm run typecheck
npx playwright test --project=chromium
npx playwright show-report
```

## Key improvements included in this version

1. **Fixed broken TypeScript module configuration**
   - Moved project to ESM-compatible package setup (`"type": "module"`)
   - Added reliable typecheck script and Node typings

2. **Restored missing Page Object implementation**
   - Added `HomePage` class to prevent fixture/type failures

3. **Resolved checkout page object initialization bug**
   - `orderTotal` locator is now initialized in constructor

4. **Fixed accessibility test configuration bug**
   - Corrected axe builder initialization from invalid key to `page`

5. **Updated faker API usage for compatibility**
   - Replaced invalid phone generator signature
   - Removed potential `undefined` card number typing issue

6. **Improved test-runner ergonomics**
   - Replaced placeholder npm test command with real Playwright runner
   - Kept retries, cross-browser projects, and practical timeouts

## Known environment caveat

If tests fail immediately with browser executable errors, install Playwright browsers:

```bash
npx playwright install
```

## CI recommendation

In CI, run:

```bash
npm ci
npx playwright install --with-deps
npm run typecheck
npm test
```

## License

ISC
