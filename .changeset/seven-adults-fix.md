---
'@urql/exchange-persisted': minor
---

Allow persisted query logic to be skipped by the `persistedExchange` if the passed `generateHash` function resolves to a nullish value. This allows (A)PQ to be selectively disabled for individual operations.
