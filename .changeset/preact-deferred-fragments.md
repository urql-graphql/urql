---
'@urql/preact': minor
---

Add a beta Preact `useFragment` hook that masks fragment data and suspends while streamed `@defer` selections are incomplete. Deferred tracking happens in `@urql/core`'s `Client`, so Suspense boundaries resolve from later query results without any binding wiring, and outside of Suspense the hook updates through `makeFragmentSource` when deferred patches arrive.
