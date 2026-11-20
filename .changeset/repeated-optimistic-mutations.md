---
'@urql/exchange-graphcache': patch
---

Give each mutation its own optimistic layer, even when its variables match another pending mutation. Previously, repeating a mutation with the same variables reused the earlier mutation's optimistic layer, so its stale optimistic data could hide newer optimistic updates. This showed up with `offlineExchange` when the same mutation was queued more than once while offline.
