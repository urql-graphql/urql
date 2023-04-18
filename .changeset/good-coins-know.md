---
'@urql/core': patch
---

Strictly deduplicate `cache-and-network` and `network-only` operations, while a non-stale response is being waited for.
