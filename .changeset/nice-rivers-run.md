---
'@urql/core': patch
---

Fix edge case in `formatDocument`, which fails to add a `__typename` field if it has been aliased to a different name.
