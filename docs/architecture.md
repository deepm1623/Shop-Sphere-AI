# Architecture

## UI and routing

Next.js App Router routes live under `src/app/`. Feature UI is grouped under `src/features/` for catalogue, products, cart, auth, checkout, orders, recommendations, assistant, and reviews.

## State boundaries

- Zustand stores hold browser/session state: cart, wishlist, recent searches, auth session, checkout progress, and recommendation signals.
- TanStack Query holds cached DummyJSON product and category data.
- Browser storage is accessed only by client-side services/stores. Persisted stores use client rehydration to avoid server-rendering storage access.
- Catalogue discovery keeps query, filter, sort, and page state in URL parameters for shareable results. Pagination uses client-side pages of 12 products from the cached catalogue response.
- Product comparison is a catalogue-local selection capped at four unique products; its comparison view is rendered as a side-by-side overlay and does not fabricate variant data.

## Services and fixtures

Product access is isolated in `src/services/product-service.ts`. Orders, profiles, reviews, admin writes, analytics summaries, and local storage are isolated in service modules. Seed fixtures in `src/data/` (`orders.json`, `reviews.json`, `recommendations.json`, `user-preferences.json`, and `analytics.json`) provide deterministic initial data. Runtime changes use separate localStorage keys and never mutate the source fixtures.

## Recommendations

The UI uses `RecommendationRail`, which calls the recommendation service and replaceable `RecommendationProvider` contract. The deterministic provider implements nine strategies, normalized weighted scoring, stable tie-breaking, candidate exclusions, fallback behavior, and explanation reasons. See [recommendation-architecture.md](./recommendation-architecture.md).

## Assistant

The assistant panel is a client UI only. `assistant-parser.ts` extracts structured entities and refinements; product resolution reuses the local product dataset and maintains session context. It is explicitly a rule-based demo, not an LLM.

## Authorization

`ProtectedRoute` checks the non-sensitive expiring mock session and optional role. This is a client-side demonstration guard, not production-grade server authorization.
