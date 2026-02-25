---
'@urql/vue': patch
---

Fix Vue query variable serialization so `ref` values inside plain variable objects are unwrapped before sending a request.
