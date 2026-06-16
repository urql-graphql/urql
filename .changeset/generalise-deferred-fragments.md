---
'@urql/core': minor
'@urql/preact': minor
---

Generalise the deferred-fragment and fragment-masking logic behind React's BETA `useFragment`
hook into `@urql/core`, so other framework bindings can reuse it. `@urql/core` now exports — as
BETA — `maskFragment`, which masks a piece of `data` against a fragment's selection set and
reports whether it's fulfilled or still streaming in, alongside the deferred-fragment helpers
`updateDeferredResult`, `makeDeferredState`, `resolveDeferredState`, `isDeferredPromise`, and
`getDeferredCacheForClient`. Together these install stable promises for missing fields inside
`@defer` selections and resolve them directly from a query stream.

Add a BETA `useFragment` hook to the Preact bindings, mirroring the React hook. Given a fragment
document and a piece of `data`, it returns the data masked to that fragment. When the `Client`
(or the hook's `context`) has `suspense` enabled, it suspends while deferred fragment data is
still streaming in, and otherwise reports the in-progress state via its `fetching` flag.
