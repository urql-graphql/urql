---
'urql': minor
---

Leverage the new `use-sync-external-store` package and `useSyncExternalStore` hook in `useQuery` implementation to bring the state synchronisation in React in line with React v18. While the current implementation works already with React Suspense and React Concurrent this will reduce the maintenance burden of our implementation and ensure certain guarantees so that React doesn't break us.
