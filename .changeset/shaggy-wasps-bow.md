---
'@urql/core': patch
---

Change how we calculate the `OperationKey` to take files into account, before we
would encode them to `null` resulting in every mutation with the same variables
(excluding the files) to have the same key. This resulted in mutations that upload
different files at the same time to share a result in GraphCache.
