---
'urql': patch
---

fix(react-urql): keep suspending until data or error arrives

When graphcache or other exchanges emit partial results like `{ fetching: true }` synchronously, the component would incorrectly unsuspend and return `{ data: undefined, error: undefined }`. This fix ensures the component stays suspended until either data or error is present in the result.
