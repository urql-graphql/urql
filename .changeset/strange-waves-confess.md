---
'@urql/exchange-graphcache': patch
---

Fix queries that have erroed with a `NetworkError` (`isOfflineError`) not flowing back completely through the `cacheExchange`.
These queries should also now be reexecuted when the client comes back online.
