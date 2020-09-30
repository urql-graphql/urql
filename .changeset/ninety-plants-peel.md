---
'@urql/exchange-graphcache': patch
---

Fix a case where the `offlineExchange` would not start processing operations after hydrating persisted data when no operations arrived in time by the time the persisted data was restored. This would be more evident in Preact and Svelte due to their internal short timings.
