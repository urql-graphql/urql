---
'@urql/core': patch
---

Return `AbortController` invocation to previous behaviour where it used to be more forceful. It will now properly abort outside of when our generator yields results, and hence now also cancels requests again that have already delivered headers but are currently awaiting a response body.
