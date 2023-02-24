---
'@urql/exchange-graphcache': patch
---

Add `invariant` to data layer that prevents cache writes during cache query operations. This prevents `cache.writeFragment`, `cache.updateQuery`, and `cache.link` from being called in `resolvers` for instance.
