# Recommendation and assistant architecture

The recommendation provider is deterministic and replaceable. UI components call the recommendation rail, which calls `getRecommendations`, which delegates to the `RecommendationProvider` contract in `src/features/recommendations/recommendation-service.ts`.

## Scoring

Every component is normalized to `0..1` before weighting:

`0.20 * category + 0.15 * price + 0.15 * tag + 0.15 * rating + 0.10 * recentlyViewed + 0.10 * wishlist + 0.15 * cart`

The score is clamped to `0..1`. Results are tie-broken by rating and then product ID for deterministic output. Candidates are filtered for valid titles, finite prices, positive stock, duplicate IDs, cart items, and the current seed product. Empty signal sets fall back to valid trending/rating-ranked products.

Reasons expose the strongest positive components rather than hiding personalization behind a generic label. Local impression, click, and simulated conversion events are persisted under `shopsphere-recommendation-signals`; these are demo metrics only.

The shopping assistant uses structured keyword/entity parsing and reuses the product dataset. Its session retains the prior intent for cheaper, more expensive, better-rated, color, and similarity refinements. Ambiguous input returns clarification instead of unrelated products. It is explicitly a rule-based demo and not a real LLM.
