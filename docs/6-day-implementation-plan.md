# ShopSphere AI six-day implementation plan

**Planning basis:** approximately 4–6 focused hours per day.  
**Constraint:** This is a compressed delivery plan for a PRD originally scoped at four weeks. It preserves all requirements through small local implementations; it does not silently drop lower-depth surfaces.

## Working rules

1. Keep the existing Next.js/TypeScript/Tailwind/Zustand/TanStack Query/DummyJSON direction.
2. Add shadcn/ui primitives and configuration rather than replacing the stack.
3. Keep fetches, recommendation logic, intent parsing, validation, and pricing out of presentational components.
4. Use local JSON and browser persistence for all non-DummyJSON data.
5. Finish and test one vertical slice before starting the next.
6. A feature is not Complete until its happy path, loading/error/empty states, responsive behavior, accessibility behavior, and at least one automated test exist.
7. Mark simplified surfaces as Partial in the checklist; do not represent local simulation as a production backend.

## Day 1 — Foundation and discovery hardening

**Goal:** Turn the existing catalogue slice into the stable foundation for every later feature.

### 4–6 hour sequence

1. Repair tooling: supported lint command, shadcn initialization, shared UI primitives, test scripts, and Playwright config.
2. Create feature boundaries and shared domain types for auth, cart, checkout, order, review, recommendation, and assistant domains.
3. Split the catalogue page into header/search/filter/product-card/quick-view components.
4. Add safe DummyJSON parsing, product detail/category/search service functions, query keys, retry behavior, and last-known cache handling.
5. Complete search behavior: mobile search, live suggestions, popular/recent searches, clear-history action, URL synchronization, and no-results alternatives.
6. Add component tests for product card, search debounce, filters, quick view, and catalogue failure/empty states.

**Exit checks:** `npm run build`, supported lint command, Vitest utility/component tests, and one Playwright smoke test for catalogue/search.

## Day 2 — Product detail, cart, wishlist, and pricing

**Goal:** Complete the core browse-to-cart journey.

### 4–6 hour sequence

1. Add `/products/[id]` with image gallery/lightbox, details, rating, discount display, stock state, quantity bounds, delivery estimate, and description/specification sections.
2. Add local cart store with duplicate-line merging, stock clamping, removal, save-for-later, cached line-item data, and price-change confirmation.
3. Add pricing utilities for subtotal, simulated shipping, tax, coupons, and grand total.
4. Turn wishlist into a full route with empty state, product rendering, remove, and move-to-cart.
5. Add related/similar placeholder rails behind recommendation-compatible interfaces, clearly labelled as simplified until Day 4.
6. Test PDP stock behavior, cart quantity clamp, duplicate add, coupons, wishlist, and missing/unavailable product handling.

**Exit checks:** Product detail → add to cart → cart quantity change → wishlist/move-to-cart works at mobile and desktop sizes.

## Day 3 — Auth, protected routes, checkout, and orders

**Goal:** Complete the transactional flow using only local/mock data.

### 4–6 hour sequence

1. Add local/JWT-compatible auth store with demo customer/admin credentials, registration, logout, expiry, persistence, and role checks.
2. Add login/register routes and protected-route handling for checkout, account, orders, and admin.
3. Add checkout persistence store and six stages: customer information, address, delivery, summary, mock payment, confirmation.
4. Explicitly label payment as test mode; accept safe mock methods without card/CVV/bank/UPI credentials.
5. Add `orders.json` and local order service; create order records on confirmation and render order history/detail/tracking timeline.
6. Handle refresh/session expiry restoration and simulated payment failure without restarting checkout.
7. Add tests for login failure, route protection, checkout validation, refresh persistence, payment retry, and order creation.

**Exit checks:** Guest is redirected to login; customer can complete a simulated checkout; confirmation appears in order history; admin route is inaccessible to customer.

## Day 4 — Recommendation engine and shopping assistant

**Goal:** Deliver the architecture most heavily weighted by the PRD.

### 4–6 hour sequence

1. Add browsing-signal store: recent views, searches, categories, price band, wishlist/cart relations, and recommendation event counters.
2. Add recommendation types and local fixtures: `recommendations.json` and `user-preferences.json`.
3. Implement provider interface → mock engine → service → hook layering.
4. Implement normalized weighted score components for category, price, tags, rating, recent-view, wishlist, and cart relations.
5. Implement all nine strategies: Recently Viewed, Similar, Category-Based, Price-Based, Wishlist-Based, Cart-Based, Frequently Bought Together, Trending, Personalized For You.
6. Wire transparent rails into homepage, PDP, cart, wishlist, and account preferences.
7. Add rule-based assistant parser/service with category/price/rating extraction, context refinement, similarity references, topic changes, starter prompts, loading, and clarification fallback.
8. Add dedicated unit tests for every scoring component, strategy selection, intent extraction, and refinement.

**Exit checks:** Each strategy returns a distinct safe result; assistant satisfies MOD-AI-001/002/003; no recommendation scoring exists in React components.

## Day 5 — Account, reviews, admin, and local analytics

**Goal:** Cover registered-user and operational surfaces with minimal but real functionality.

### 4–6 hour sequence

1. Add account dashboard tabs for profile, addresses, orders, wishlist, recently viewed, reviews, and recommendation transparency/reset.
2. Add `reviews.json`, review service, listing, rating distribution, sorting, verified-purchase display, helpful interaction, and validated submit/edit/remove forms.
3. Add admin route with dashboard overview, catalogue view/edit simulation, order status simulation, customer summary, and recommendation analytics.
4. Add `analytics.json`; label every metric and write action as local/simulated.
5. Add explicit empty/loading/error/network states across account, reviews, and admin.
6. Add component tests for review validation, account empty states, admin role access, and local write labeling.

**Exit checks:** Customer and admin views are separated by role; account data persists locally; reviews and analytics are visibly simulated and functional.

## Day 6 — Quality gate, accessibility, responsive verification, and delivery

**Goal:** Verify the product rather than adding decorative scope.

### 4–6 hour sequence

1. Run full TypeScript/build/lint/test checks and resolve blocking failures.
2. Add Playwright journeys: auth, search/filter, PDP/cart, wishlist, checkout/order, recommendations, and assistant refinement.
3. Verify all required loading/error/empty/network states and the 26 PRD edge cases.
4. Perform keyboard and screen-reader pass: focus visibility, modal trap/restore/Escape, labels/descriptions, live regions, contrast, and non-color errors.
5. Verify mobile, tablet, laptop, desktop, and large-desktop behavior for navigation, filters, cart, checkout, assistant, and admin.
6. Add lazy loading for noncritical UI, confirm image sizing, inspect query caching, and document Core Web Vitals trade-offs.
7. Add README, architecture/API/testing documentation, testing report, screenshots, and deployment notes.
8. Initialize Git if permitted, create descriptive feature commits, and verify the production deployment.

**Exit checks:** Production build and deployment are reachable; tests are reported honestly; no unresolved critical console errors; checklist statuses reflect evidence.

## Risk controls and scope decisions

| Risk | Control |
|---|---|
| Four-week PRD compressed into six days | Prefer small real implementations and service contracts over decorative depth |
| Recommendation engine delayed until the end | Establish types/provider boundary on Day 1 and implement engine on Day 4 before polishing |
| Checkout/auth blocks demonstration | Implement local/JWT-compatible mock flows on Day 3 with persistent state |
| DummyJSON shape/availability changes | Validate responses, cache last-known data, and use local fixtures for non-product domains |
| shadcn setup consumes time | Use only the primitives required for dialog, sheet, select, input, button, tabs, and toast |
| Admin scope expands | Keep catalogue/order/analytics views shallow but functional and clearly simulated |
| Testing becomes a final-day checkbox | Add a test beside each completed vertical slice; reserve Day 6 for cross-flow E2E and a11y |
| Missing Git/deployment access | Continue local verification and mark Git/deployment items Blocked rather than claiming completion |

## Definition-of-done gate for each milestone

Before moving to the next day, confirm:

- The relevant PRD acceptance criterion is represented by a test or documented manual check.
- The feature has loading, empty, error, and network-failure behavior where applicable.
- Inputs are validated and user/API content is safely rendered.
- The surface is usable with keyboard and at required breakpoints.
- The implementation uses the intended service/store/query boundary.
- The requirement checklist status is updated to Complete, Partial, Missing, or Blocked based on evidence.
