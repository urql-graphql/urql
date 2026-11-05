---
'@urql/core': patch
---

Fix `cacheExchange` keeping a query result that may predate a mutation. When a mutation or subscription result invalidated a typename while a query's request was in-flight, the query could miss its refetch, and the older result was cached and delivered as fresh. Such a result is now marked as `stale`, isn't cached, and the query is refetched once the request completes.
