---
'@urql/exchange-graphcache': patch
'@urql/core': patch
---

Add `OperationContext.optimistic` flag as an internal indication on whether a mutation triggered an optimistic update in `@urql/exchange-graphcache`'s `cacheExchange`.
