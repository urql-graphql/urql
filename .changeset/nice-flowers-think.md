---
'@urql/core': patch
---

Fix `hasNext` being defaulted to `false` when a new subscription event is received on the `subscriptionExchange` that doesn't have `hasNext` set.
