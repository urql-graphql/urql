---
'urql': minor
---

Add a beta React `useFragment` hook that masks fragment data and suspends while streamed `@defer` selections are incomplete. Deferred tracking happens in `@urql/core`'s `Client`, so nested Suspense boundaries resolve directly from later query results during client and server rendering, and outside of Suspense the hook updates through `makeFragmentSource` when deferred patches arrive.
