---
'@urql/exchange-graphcache': patch
---

Fix torn down queries not being removed from `offlineExchange`’s failed queue on rehydration.
