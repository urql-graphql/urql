---
'@urql/core': minor
---

Add beta fragment-masking and deferred-result utilities to `@urql/core`. `maskFragment` masks data against a fragment selection, while the deferred-state helpers associate stable sidecar promises with missing fields in streamed `@defer` results so framework bindings can resolve Suspense boundaries directly from a query stream.
