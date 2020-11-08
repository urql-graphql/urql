---
'@urql/preact': patch
'urql': patch
---

Fix server-side rendering by disabling the new Suspense cache on the server-side and clear it for prepasses.
