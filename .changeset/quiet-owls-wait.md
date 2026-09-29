---
'@urql/exchange-graphcache': patch
---

Mark cached results of queries as `stale` while a network request for them is in flight. Previously, when a mutation updated a `network-only` query while its request was in flight, the query's cached result looked final, so `toPromise()` resolved with it before the request completed.
