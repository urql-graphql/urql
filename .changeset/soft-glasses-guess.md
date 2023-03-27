---
'@urql/core': patch
---

Refactor `Client` result source construction code and allow multiple mutation
results, if `result.hasNext` on a mutation result is set to `true`, indicating
deferred or streamed results.
