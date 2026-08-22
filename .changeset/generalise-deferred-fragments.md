---
'@urql/core': minor
---

Add beta fragment utilities to `@urql/core`. `maskFragment` masks data against a fragment selection, and `makeFragmentSource` issues masked snapshots that re-emit as `@defer`-red patches stream in. The `Client` now automatically associates stable sidecar promises with missing fields in streamed `@defer` query results and resolves them as patches arrive (or on teardown), so framework bindings can resolve Suspense boundaries directly from a query stream without any per-binding wiring.
