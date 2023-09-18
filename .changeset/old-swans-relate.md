---
'@urql/core': patch
---

Fix missing `teardown` operation handling in the `ssrExchange`. This could lead to duplicate network operations being executed.
