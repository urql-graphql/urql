---
'@urql/exchange-graphcache': patch
'@urql/core': patch
---

Prevents `cache-only` operations from getting forwarded outside of the cache when no result was found
