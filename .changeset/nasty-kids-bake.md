---
'urql': patch
---

Fix in edge-case in client-side React Suspense, where after suspending due to an update a new state value is given to `useSource` in a render update. This was previously then causing us to subscribe to an outdated source in `useEffect` since the updated source would be ignored by the time we reach `useEffect` in `useSource`.
