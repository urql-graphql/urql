---
'@urql/core': patch
---

Prevent `mapExchange` from forwarding async-mapped operations after their teardown has already been received.
