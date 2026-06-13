---
'urql': minor
---

Add a BETA `useFragment` hook to the React bindings. Given a fragment document and
a piece of `data`, it returns the data masked to that fragment. When the `Client` (or
the hook's `context`) has `suspense` enabled, it suspends while deferred fragment data
is still streaming in, and otherwise reports the in-progress state via its `fetching`
flag.

React `useQuery` now installs stable promises for missing fields inside `@defer`
selections and resolves them directly from the query stream as later results arrive.
This lets deferred fragments wake Suspense boundaries during server streams without
depending on a parent component rerender.
