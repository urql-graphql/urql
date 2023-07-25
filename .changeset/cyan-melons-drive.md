---
'@urql/exchange-graphcache': patch
---

Record a dependency when `__typename` field is read. This removes a prior, outdated exception to avoid confusion when using `cache.resolve(entity, '__typename')` which doesn't cause the cache to record a dependency.
