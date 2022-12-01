---
'next-urql': patch
---

Change import for `createClient` to `@urql/core`, which helps Next not depend on `urql` and hence not cause `createContext` to be called when the import is treeshaken away.
