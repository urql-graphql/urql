---
'@urql/core': patch
---

Fix `fetchSource` not working for subscriptions since `hasNext` isn’t necessarily set.
