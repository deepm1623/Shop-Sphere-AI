# Testing and verification

## Commands

```bash
npm test
npm run test:e2e -- --workers=1
npm run lint
npx tsc --noEmit
npm run build
```

## Latest verification

- `npm test`: passed, 12 test files and 42 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; all application routes compiled.
- `npm run test:e2e -- --workers=1`: passed — 10 Chromium tests. Coverage includes catalogue/product detail, responsive product cards, pagination across pages with URL history, protected routes, assistant disclosure, mobile search and comparison, successful six-stage checkout, payment failure/retry, cart clearing, duplicate-safe persistence, confirmation refresh, and invalid checkout validation.
- Shared interaction controls: button variants, loading/disabled behavior, accessible icon labels, cart steppers/removal, product add-to-cart, checkout actions, and auth mode switching passed lint, type-check, build, unit, and browser regression validation.

Unit/service coverage includes catalogue utilities, cart pricing/store behavior, product states, authentication, checkout validation, orders, recommendation scoring/strategies, assistant parsing, reviews, admin rules, and analytics aggregation.

## Limitations

Playwright coverage includes the complete successful checkout and payment retry journeys, mobile search/comparison, pagination/history, and admin route protection. Review submission after a completed order, browser-admin CRUD/category/order journeys, complete responsive route coverage, session-expiry checkout restoration, and all recommendation rails still require broader browser coverage. Serial execution is recommended because parallel workers contend for the reused local development server in this workspace.

## Manual browser smoke verification

Using the running local development server, the catalogue loaded DummyJSON products, pagination remained on pages 2 and 3 after one second, Back/Forward restored page state, mobile search rendered full width and showed suggestions, product comparison rendered a side-by-side table, product detail loaded product data, the cart showed the empty state, `/account` redirected to `/login?next=%2Faccount`, customer login restored `/account`, the administrator login opened `/admin` with Local Analytics and product/category/order controls, and inspected desktop/mobile screens had no horizontal overflow. These observations are smoke checks, not a substitute for full journey coverage. See `docs/ui-audit.md` and `docs/final-prd-audit.md` for route-by-route status.
