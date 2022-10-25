---
'@urql/core': patch
---

Fix case where our transform-debug-target babel plugin would override the root dispatchDebug in `compose.ts` with the latest found exchange, in this case `fetchExchange`
