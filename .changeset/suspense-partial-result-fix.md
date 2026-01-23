---
'urql': patch
---

fix(react-urql): keep suspending until data or error arrives

When using suspense, the component now correctly stays suspended until the result contains either `data` or `error`. Previously, a result with `{ data: undefined, error: undefined }` would cause the component to exit suspension prematurely.
