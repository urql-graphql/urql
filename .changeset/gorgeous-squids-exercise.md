---
'@urql/core': major
---

Remove `pollInterval` feature from `OperationContext`. Instead consider using a source that uses `Wonka.interval` and `Wonka.switchMap` over `client.query()`'s source.
