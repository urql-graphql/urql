---
'@urql/exchange-graphcache': patch
---

Changes the type for the `updater` function of `cache.updateQuery` to `DataFields` this doesn't require `__typename` to be defined. This PR also adds a fallback in `updateQuery` when `__typename` is missing.
