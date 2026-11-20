---
'@urql/exchange-graphcache': patch
---

Persist results that are written to the cache while the `offlineExchange`'s storage is still being read, such as server-rendered results restored on page load; previously these never reached the storage.
