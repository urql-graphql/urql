---
'@urql/exchange-graphcache': patch
---

Fix list items being returned as `null` even for non-nullable lists, when the entities are missing in the cache. This could happen when a resolver was added returning entities or their keys. This behaviour is now (correctly) only applied to partial results with schema awareness.
