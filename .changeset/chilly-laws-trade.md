---
'@urql/svelte': major
---

Improve granularity of `operationStore` updates when `query`, `variables`, and `context` are changed. This also adds an `operationStore(...).reexecute()` method, which optionally accepts a new context value and forces an update on the store, so that a query may reexecute.
