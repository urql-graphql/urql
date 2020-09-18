---
'@urql/exchange-graphcache': patch
---

Fix operation results being obstructed by the `offlineExchange` when the network request has failed due to being offline and no cache result has been issued. Instead the `offlineExchange` will now retry with `cache-only` policy
