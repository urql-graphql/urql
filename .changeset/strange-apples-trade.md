---
'@urql/exchange-persisted-fetch': major
---

Remove `persistedFetchExchange` and instead implement `persistedExchange`. This exchange must be placed in front of a terminating exchange (such as the default `fetchExchange` or a `subscriptionExchange` that supports persisted queries), and only modifies incoming operations to contain `extensions.persistedQuery`, which is sent on via the API. If the API expects Automatic Persisted Queries, requests are retried by this exchange internally.
