---
'@urql/exchange-graphcache': patch
---

Only record dependencies that are changing data, this will reduce the amount of operations we re-invoke due to network-only/cache-and-network queries and mutations
