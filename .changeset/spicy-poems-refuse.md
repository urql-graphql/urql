---
'urql': patch
---

Fix suspense cache entries getting poisoned when an operation ends without a result. When an operation was torn down while a `useQuery` was suspended, its suspense promise could never resolve and was re-thrown on every future render, permanently stuck on its `Suspense` fallback. Similarly, a settled promise entry would be re-thrown on every render, locking React into an infinite render loop. Such entries are now evicted from the suspense cache and the query is executed again.
