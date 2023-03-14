---
'@urql/core': patch
---

Move `multipart/mixed` to end of `Accept` header to avoid cauing Yoga to unnecessarily use it.
