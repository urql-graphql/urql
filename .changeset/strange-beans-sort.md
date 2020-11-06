---
'@urql/core': minor
'@urql/preact': minor
'urql': minor
---

Improve the Suspense implementation, which fixes edge-cases when Suspense is used with subscriptions, partially disabled, or _used on the client-side_. It has now been ensured that client-side suspense functions without the deprecated `suspenseExchange` and uncached results are loaded consistently. As part of this work, the `Client` itself does now never throw Suspense promises anymore, which is functionality that either way has no place outside of the React/Preact bindings.
