---
'@urql/core': patch
---

Explicitly unblock `client.reexecuteOperation` calls to allow stalled operations from continuing and re-executing. Previously, this could cause `@urql/exchange-graphcache` to stall if an optimistic mutation led to a cache miss.
