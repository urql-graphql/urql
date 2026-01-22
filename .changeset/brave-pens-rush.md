---
'urql': patch
---

fix(react-urql): prevent orphaned suspense promises from hanging

When a component unmounts while suspended (e.g., during navigation), the cached suspense promise becomes orphaned because its backing subscription is torn down. If the component remounts, it would throw the orphaned promise which would never resolve, causing the component to hang indefinitely.

This fix tracks active promises using a WeakSet and detects orphaned promises before throwing them. When an orphaned promise is detected, a new subscription is created instead of throwing the stale promise.
