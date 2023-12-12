---
'@urql/core': patch
---

Fix the default `cacheExchange` crashing on `cache-only` request policies with cache misses due to `undefined` results.
