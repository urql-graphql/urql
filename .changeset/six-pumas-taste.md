---
'@urql/core': patch
---

Fix `ssrExchange` invalidating results on the client-side too eagerly, by delaying invalidation by a tick
