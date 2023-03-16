---
'@urql/core': patch
---

Ensure network errors are always issued with `CombinedError`s, while downstream errors are re-thrown.
