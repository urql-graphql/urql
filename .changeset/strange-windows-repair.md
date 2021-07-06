---
'@urql/vue': patch
---

Refactor `useQuery` implementation to utilise the single-source implementation of `@urql/core@2.1.0`. This should improve the stability of promisified `useQuery()` calls and prevent operations from not being issued in some edge cases.
