---
'next-urql': patch
---

Fix `resetUrqlClient` not resetting the SSR cache itself and instead restoring data when all data related to this `Client` and session should've been deleted.
