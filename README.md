# ShopSphere AI

ShopSphere AI is a frontend-only e-commerce demonstration for personalized product discovery. It combines a DummyJSON catalogue with browser-local cart, account, order, review, recommendation, and admin-demo state. The application includes a rule-based shopping assistant and explainable recommendation strategies without a backend, paid API, real payment gateway, or production identity provider.

## Problem statement

Basic product-listing demos do not demonstrate the discovery, personalization, transaction, and operational workflows expected from a modern storefront. ShopSphere AI addresses that gap with a responsive catalogue, search and filters, product comparison, product details, cart and checkout flow, order tracking, customer account surfaces, recommendations, a transparent assistant, and a mock administrator dashboard.

## Objectives

- Provide a usable multi-category product discovery experience.
- Preserve shopping state locally across the demo journey.
- Demonstrate explainable, signal-driven recommendations.
- Provide a rule-based assistant that reuses catalogue data.
- Demonstrate customer, order, review, and administrator workflows.
- Keep the project runnable with zero paid infrastructure.

## Implemented features

- DummyJSON product and category catalogue with loading, error, empty, search, filters, sorting, pagination, URL state, and responsive cards.
- Debounced product/category suggestions, recent and popular search states, clear search, and no-results handling.
- Product quick view, detail gallery, quantity controls, wishlist, comparison for 2–4 products, and related recommendations.
- Cart quantity updates, stock clamping, removal, saved-for-later, pricing summary, unavailable-item handling, and cart recommendations.
- Six-stage checkout with customer/address validation, delivery choices, mock payment options, simulated payment failure/retry, idempotent local order creation, and confirmation persistence.
- Protected customer account, profile and address management, order history/details/tracking, wishlist controls, recently viewed products, and personalization reset.
- Local reviews with validation, sorting, helpful voting, verified-purchase indication, duplicate prevention, and administrator moderation.
- Nine recommendation strategies with weighted scoring, explanations, exclusions, fallbacks, and local analytics.
- Rule-based assistant with explicit demo disclosure, structured intent parsing, contextual refinements, starter prompts, and inline product actions.
- Administrator-only demo dashboard for product/category/order management, inventory, order progression, review moderation, and recommendation analytics.

Known PRD gaps are recorded in [docs/final-prd-audit.md](docs/final-prd-audit.md) and summarized below.

## Technology stack

- Next.js App Router 16
- React 19 and TypeScript
- Tailwind CSS
- Zustand for browser/session state
- TanStack Query for DummyJSON data and caching
- Radix Slot/Dialog and Lucide icons
- Vitest and React Testing Library
- Playwright

## Project structure

```text
src/
  app/                 App Router pages and route entry points
  components/          Shared providers and UI primitives
  features/            Catalogue, products, cart, checkout, auth, orders,
                       reviews, recommendations, and assistant UI
  services/            Product, order, profile, review, admin, analytics,
                       and local-storage services
  store/               Zustand stores for auth, shop, checkout, and signals
  types/               Shared Product, Order, and domain types
  data/                Required local JSON seed fixtures
e2e/                   Playwright critical journeys
docs/                  Architecture, testing, UI, and PRD audit documents
```

## Prerequisites

- Node.js compatible with the installed Next.js version
- npm
- Network access to `https://dummyjson.com` for live product/category data
- Chromium installed for Playwright browser tests

## Installation and environment

```bash
npm install
```

The optional product API endpoint is configured through `NEXT_PUBLIC_PRODUCT_API_URL`. The committed example points to DummyJSON:

```text
NEXT_PUBLIC_PRODUCT_API_URL=https://dummyjson.com
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

No secret environment variables are required. Do not add real credentials or payment data.

## Run the application

Development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Production build and server:

```bash
npm run build
npm run start
```

## Verification commands

Unit and service tests:

```bash
npm test
```

Lint and type-check:

```bash
npm run lint
npx tsc --noEmit
```

Playwright uses a serial worker in the shared development environment to avoid localhost server contention:

```bash
npm run test:e2e -- --workers=1
```

The default parallel `npm run test:e2e` script remains available, but the final audit observed contention when eight workers reused the same local server. See [docs/testing.md](docs/testing.md).

## Mock data and local persistence

Product and category data are read from DummyJSON. Required local seed fixtures are in [`src/data/`](src/data/):

- `orders.json`
- `reviews.json`
- `recommendations.json`
- `user-preferences.json`
- `analytics.json`

Runtime cart, wishlist, comparison, authentication, checkout, orders, reviews, admin changes, and recommendation analytics use browser `localStorage` or Zustand persistence. Seed fixtures are not overwritten. This is a frontend demo; local writes are not shared between browsers or users.

Demo accounts:

- Customer: `customer@shopsphere.demo` / `shop123`
- Administrator: `admin@shopsphere.demo` / `admin123`

## Documentation

- [Architecture](docs/architecture.md)
- [Recommendation architecture](docs/recommendation-architecture.md)
- [Testing and verification](docs/testing.md)
- [UI audit](docs/ui-audit.md)
- [Requirements checklist](docs/requirements-checklist.md)
- [Final PRD audit](docs/final-prd-audit.md)
- [Final project report](docs/final-project-report.md)
- [Recommended submission assets](docs/submission-assets.md)

## Known limitations

- Coupon behavior is blocked because the PRD does not specify valid codes, discount rules, eligibility, expiry, or tax/shipping interaction.
- The current product model has no variants, so no variant selector is fabricated.
- Review rating distribution and customer review edit/remove are not implemented.
- Some recommendation, assistant retry, cached-network, session-expiry, accessibility, and route-by-breakpoint coverage is partial.
- Authentication and admin authorization are client-side mock protections, not production security.
- No deployment URL, screenshots, demo video, commit history, or pull request history is included in this workspace.

See the final audit for the complete requirement matrix and priority assessment.

## Deployment status

No deployment was performed or verified. The project is prepared for local submission and production-build verification, but no live URL should be claimed.
