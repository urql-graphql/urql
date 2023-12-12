---
'@urql/core': patch
---

When we are dealing with a `cache-only` request-policy we should return a result on cache-miss, if we don't do this defaulting we end up returning `undefined` which crashes the client entirely
