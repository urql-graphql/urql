---
'@urql/core': patch
---

Fix oversight in edge case for #662. The operation queue wasn't marked as being active which caused `stale` results and `cache-and-network` operations from reissuing operations immediately (unqueued essentially) which would then be filtered out by the `dedupExchange`.
