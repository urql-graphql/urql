---
'@urql/core': patch
---

Fix `ssrExchange` not formatting query documents using `formatDocument`. Without this call we'd run the risk of not having `__typename` available on the client-side when rehydrating.
