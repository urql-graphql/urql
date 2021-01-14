---
'urql': patch
---

Fix edge cases related to Suspense triggering on an update in Concurrent Mode. Previously it was possible for stale state to be preserved across the Suspense update instead of the new state showing up. This has been fixed by preventing the suspending query source from closing prematurely.
