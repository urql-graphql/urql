---
'@urql/exchange-persisted-fetch': minor
---

Add `enforcePersistedQueries` option to `persistedFetchExchange`, which disables automatic persisted queries and retry logic, and instead assumes that persisted queries will be handled like normal GraphQL requests.
