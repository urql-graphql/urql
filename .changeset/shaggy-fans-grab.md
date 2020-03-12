---
'@urql/core': minor
---

Add `additionalTypenames` to the `OperationContext`, this allows the `document-cache` to invalidate efficiently when the `__typename` is unknown at the initial fetch.
