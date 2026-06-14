---
'@urql/core': patch
---

Unwrap the `payload` property in `makeResult` so that the first incremental/multipart response is parsed correctly. Previously, transports that wrap each result in a `payload` property (e.g. Apollo Federation's multipart subscriptions) would have their first response dropped as "No Content", while subsequent responses were handled correctly by `mergeResultPatch`.
