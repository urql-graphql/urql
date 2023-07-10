---
'@urql/exchange-auth': patch
---

Handle `refreshAuth` rejections and pass the resulting error on to `OperationResult`s on the authentication queue.
