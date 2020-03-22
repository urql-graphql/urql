---
'@urql/exchange-graphcache': patch
---

Fix case where a mutation-rootfield would cause an empty call to the cache.updates[mutationRootField].
