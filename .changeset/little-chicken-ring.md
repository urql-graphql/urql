---
'@urql/exchange-graphcache': minor
---

Implement refetch blocking for queries that are affected by optimistic update. When a query would normally be refetched, either because it was partial or a cache-and-network operation, we now wait if it touched optimistic data for that optimistic mutation to complete. This prevents optimistic update data from unexpectedly disappearing
