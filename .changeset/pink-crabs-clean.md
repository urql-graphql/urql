---
'@urql/core': patch
---

Fix condition where mutated result data would be picked up by the `ssrExchange`, for instance as a result of mutations by Graphcache. Instead the `ssrExchange` now serializes data early.
