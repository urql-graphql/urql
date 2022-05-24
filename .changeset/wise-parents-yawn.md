---
'@urql/svelte': major
---

Reimplement Svelte with functional-only API.
We've gotten plenty of feedback and issues from the Svelte community about our prior
Svelte bindings. These bindings favoured a Store singleton to read and write to,
and a separate signal to start an operation.
Svelte usually however calls for a lot more flexibility, so we're returning the
API to a functional-only API again that serves to only create stores, which is more
similar to the original implementation.
