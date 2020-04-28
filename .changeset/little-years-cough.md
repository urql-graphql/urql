---
'@urql/exchange-persisted-fetch': patch
---

Fix `persistedFetchExchange` not sending the SHA256 hash extension after a cache miss (`PersistedQueryNotFound` error)
