---
'@urql/svelte': patch
---

Improve `OperationStore` and `subscription` types to allow for result types of `data` that differ from the original `Data` type, which may be picked up from `TypedDocumentNode`.
