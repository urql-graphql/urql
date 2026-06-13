---
'@urql/exchange-graphcache': patch
---

Fix `relayPagination` merging pages in the order they were written to the cache rather than in their cursor order. When multiple pages were requested concurrently and a later page's response was written before an earlier one's, the combined `edges`/`nodes` could transiently end up in the wrong order. Pages are now reordered along their cursor chain (via `after`/`endCursor` and `before`/`startCursor`) before being concatenated, while pages without a known predecessor keep their original order.
