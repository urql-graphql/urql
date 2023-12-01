---
'@urql/exchange-persisted': patch
---

Warn about cached persisted-miss results in development, when a `persistedExchange()` sees a persisted-miss error for a result that's already seen a persisted-miss error (i.e. two misses). This shouldn't happen unless something is caching persisted errors and we should warn about this appropriately.
