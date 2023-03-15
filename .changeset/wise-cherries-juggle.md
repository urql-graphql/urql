---
'@urql/core': minor
---

Deprecate the `dedupExchange`. The functionality of deduplicating queries and subscriptions has now been moved into and absorbed by the `Client`.

Previously, the `Client` already started doing some work to share results between
queries, and to avoid dispatching operations as needed. It now only dispatches operations
strictly when the `dedupExchange` would allow so as well, moving its logic into the
`Client`.
