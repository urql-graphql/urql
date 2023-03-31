---
'@urql/core': patch
---

Fix format of `map` form data field on multipart upload requests. This was erroneously set to a string rather than a string tuple.
