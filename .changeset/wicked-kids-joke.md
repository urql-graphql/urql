---
'@urql/exchange-graphcache': patch
---

Fix `store.resolve()` returning the exact link array that’s used by the cache. This can lead to subtle bugs when a user mutates the result returned by `cache.resolve()`, since this directly mutates what’s in the cache at that layer.
