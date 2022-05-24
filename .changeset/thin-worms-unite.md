---
'@urql/exchange-graphcache': patch
---

Switch `isFragmentHeuristicallyMatching()` to always return `true` for writes, so that we give every fragment a chance to be applied and to write to the cache.
