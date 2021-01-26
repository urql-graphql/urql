---
'urql': minor
---

Reimplement `useQuery` to apply a consistent Suspense cache (torn down queries will still eliminate stale values) and support all Concurrent Mode edge cases. This work is based on `useMutableSource`'s mechanisms and allows React to properly fork lanes since no implicit state exists outside of `useState` in the implementation. The `useSubscription` hook has been updated similarly without a cache or retrieving values on mount.
