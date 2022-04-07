---
'@urql/core': patch
---

Fix issue where a synchronous `toPromise()` return would not result in the stream tearing down
