---
'@urql/core': patch
---

Fix `ssrExchange` bug which prevented `staleWhileRevalidate` from sending off requests as network-only requests, and caused unrelated `network-only` operations to be dropped.
