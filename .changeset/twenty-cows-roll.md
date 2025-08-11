---
'@urql/exchange-persisted': patch
'@urql/core': patch
---

Use nullish coalescing for `preferGetMethod` and `preferGetForPersistedQueries` so that `false` is kept if set.
