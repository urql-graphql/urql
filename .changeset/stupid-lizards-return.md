---
'@urql/exchange-graphcache': minor
---

Add `cache.invalidate` to invalidate an entity directly to remove it from the cache and all subsequent cache results, e.g. `cache.invalidate({ __typename: 'Todo', id: 1 })`
