---
'@urql/exchange-graphcache': patch
---

Fix edge-case where query results would pick up invalidated fields from mutation results as they're written to the cache. This would cause invalid cache misses although the result was expected to just be passed through from the API result.
