---
'@urql/exchange-graphcache': patch
---

Fix queries that have erroed with a `NetworkError` (`isOfflineError`) not flowing back completely through the `cacheExchange`.
