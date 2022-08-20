---
'@urql/vue': patch
---

Fix an issue that caused `useQuery` to fail for promise-based access, if a result is delivered by the `Client` immediately.
