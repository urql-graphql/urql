---
'@urql/exchange-graphcache': patch
---

Defer requests that subscription results cause for queries that already have a request in flight. Previously, a burst of subscription events updating a slow query could send a duplicate request for every other event. The query is now refetched once, after its in-flight request completes.
