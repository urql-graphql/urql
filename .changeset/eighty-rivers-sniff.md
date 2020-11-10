---
'@urql/preact': patch
'urql': patch
---

Fix regression in client-side Suspense behaviour. This has been fixed in `urql@1.11.0` and `@urql/preact@1.4.0` but regressed in the patches afterwards that were aimed at fixing server-side Suspense.
