---
'@urql/exchange-graphcache': patch
---

Set `stale: true` on cache results, even if a reexecution has been blocked by the loop protection, if the operation is already pending and in-flight.
